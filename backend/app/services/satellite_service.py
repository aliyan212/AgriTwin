"""Satellite data service — MODIS NDVI time series + Sentinel Hub integration.

Primary NDVI source: NASA MODIS (MOD13Q1, 250 m, 16-day composites) via the
ORNL DAAC REST API — free and requires no authentication. Sentinel Hub remains
available for high-resolution polygon statistics when credentials are configured.
"""

import datetime

import httpx

from app.config import settings


def _to_modis_date(d: datetime.date) -> str:
    """Convert a calendar date to MODIS format (AYYYYDDD), e.g. 2026-07-12 → A2026193."""
    return f"A{d.year}{d.timetuple().tm_yday:03d}"


class SatelliteService:
    """Fetch satellite observations from MODIS / Sentinel Hub."""

    def __init__(self):
        self.base_url = settings.SENTINEL_HUB_BASE_URL
        self.modis_url = settings.MODIS_BASE_URL
        self.client_id = settings.SENTINEL_HUB_CLIENT_ID
        self.client_secret = settings.SENTINEL_HUB_CLIENT_SECRET
        self._access_token: str | None = None
        self._token_expiry: datetime.datetime | None = None

    async def get_ndvi_timeseries(self, lat: float, lon: float, months: int = 12) -> list[dict]:
        """Fetch a real NDVI time series from NASA MODIS (MOD13Q1).

        Uses the ORNL DAAC REST API — free, no authentication required.
        Data comes as 16-day composites at 250 m resolution, scaled by 0.0001,
        with -3000 as the fill value. The API limits each request to 10 tiles
        (~160 days), so longer windows are paginated.

        Returns a date-sorted list of {"date": "YYYY-MM-DD", "ndvi": float}.
        """
        today = datetime.date.today()
        # MODIS composites lag ~35 days behind real time
        end = today - datetime.timedelta(days=40)
        start = end - datetime.timedelta(days=months * 30)

        points: dict[str, float] = {}
        cur = start
        while cur <= end:
            chunk_end = min(cur + datetime.timedelta(days=150), end)
            params = {
                "latitude": lat,
                "longitude": lon,
                "band": "250m_16_days_NDVI",
                "startDate": _to_modis_date(cur),
                "endDate": _to_modis_date(chunk_end),
                "kmAboveBelow": 0,
                "kmLeftRight": 0,
            }
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.get(
                        f"{self.modis_url}/MOD13Q1/subset", params=params
                    )
                    resp.raise_for_status()
                    data = resp.json()
            except (httpx.HTTPError, ValueError):
                cur = chunk_end + datetime.timedelta(days=1)
                continue

            for item in data.get("subset", []):
                raw = item["data"][0] if item.get("data") else None
                if raw is None or raw == -3000:  # fill value
                    continue
                points[item["calendar_date"]] = round(raw * 0.0001, 4)

            cur = chunk_end + datetime.timedelta(days=1)

        return [
            {"date": d, "ndvi": v} for d, v in sorted(points.items())
        ]

    async def _get_access_token(self) -> str:
        """Authenticate with Sentinel Hub OAuth2 client credentials."""
        if self._access_token and self._token_expiry and datetime.datetime.utcnow() < self._token_expiry:
            return self._access_token

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://identity.dataspace.copernicus.eu/auth/realms/Dataspace/protocol/openid-connect/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
            )
            resp.raise_for_status()
            token_data = resp.json()

        self._access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 300)
        self._token_expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in - 60)
        return self._access_token

    async def get_ndvi_stats(
        self,
        geometry_geojson: dict,
        date_from: str,
        date_to: str,
    ) -> dict:
        """Request NDVI statistics over a farm polygon from Sentinel Hub Statistical API.

        geometry_geojson: GeoJSON polygon of the farm.
        Returns mean NDVI, stdDev, min, max for the requested period.
        """
        if not self.client_id:
            return {"status": "no_credentials", "message": "Sentinel Hub credentials not configured."}

        token = await self._get_access_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        evalscript = """
        //VERSION=3
        function setup() {
            return { input: ["B04", "B08"], output: [{ id: "ndvi", bands: 1 }] };
        }
        function evaluatePixel(sample) {
            let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
            return { ndvi: [ndvi] };
        }
        """

        payload = {
            "input": {
                "bounds": {"geometry": geometry_geojson},
                "data": [
                    {
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {"from": date_from, "to": date_to},
                            "maxCloudCoverage": 20,
                        },
                    }
                ],
            },
            "evalscript": evalscript,
            "aggregation": {
                "timeRange": {"from": date_from, "to": date_to},
                "aggregationInterval": {"of": "P1D"},
                "evalscript": evalscript,
            },
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.base_url}/api/v1/statistics",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()


satellite_service = SatelliteService()
