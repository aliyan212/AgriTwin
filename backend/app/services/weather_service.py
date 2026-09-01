"""Weather data service — integrates Open-Meteo and NASA POWER APIs."""

import datetime

import httpx

from app.config import settings


class WeatherService:
    """Fetch weather data from external providers."""

    def __init__(self):
        self.open_meteo_url = settings.OPEN_METEO_BASE_URL
        self.air_quality_url = settings.OPEN_METEO_AIR_QUALITY_URL
        self.nasa_power_url = settings.NASA_POWER_BASE_URL

    async def get_forecast_open_meteo(
        self, lat: float, lon: float, forecast_days: int = 7
    ) -> dict:
        """Fetch hourly weather forecast from Open-Meteo (no API key required).

        Returns temperature, humidity, precipitation, wind, ET0, cloud cover,
        soil moisture, and solar radiation.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation",
                    "precipitation_probability",
                    "wind_speed_10m",
                    "et0_fao_evapotranspiration",
                    "cloud_cover",
                    "shortwave_radiation",
                    "soil_moisture_0_to_7cm",
                    "soil_temperature_0_to_7cm",
                ]
            ),
            "daily": ",".join(
                [
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "relative_humidity_2m_mean",
                    "precipitation_sum",
                    "wind_speed_10m_max",
                    "et0_fao_evapotranspiration",
                    "sunrise",
                    "sunset",
                ]
            ),
            "timezone": "Asia/Karachi",
            "forecast_days": forecast_days,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self.open_meteo_url}/forecast", params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_current_weather_open_meteo(self, lat: float, lon: float) -> dict:
        """Fetch current weather conditions from Open-Meteo."""
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation",
                    "wind_speed_10m",
                    "cloud_cover",
                    "soil_moisture_0_to_7cm",
                    "soil_temperature_0_to_7cm",
                ]
            ),
            "timezone": "Asia/Karachi",
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self.open_meteo_url}/forecast", params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_air_quality(self, lat: float, lon: float) -> dict | None:
        """Fetch real-time air quality (PM2.5 / PM10) from the Open-Meteo
        Air Quality API (CAMS global forecast, no API key required).

        Returns None on any failure — air quality is informational only.
        """
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{self.air_quality_url}/air-quality",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "pm2_5,pm10",
                        "timezone": "Asia/Karachi",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception:
            return None

        current = data.get("current", {})
        if current.get("pm2_5") is None and current.get("pm10") is None:
            return None
        return {
            "pm2_5": current.get("pm2_5"),
            "pm10": current.get("pm10"),
            "source": "Open-Meteo Air Quality (CAMS)",
            "updated_at": current.get("time"),
        }

    async def get_historical_nasa_power(
        self, lat: float, lon: float, start_date: str, end_date: str
    ) -> dict:
        """Fetch historical climate data from NASA POWER.

        Dates should be YYYYMMDD format, e.g. '20230101'.
        Returns temperature, humidity, precipitation, solar radiation, wind.
        """
        params = {
            "parameters": ",".join(
                [
                    "T2M",
                    "T2M_MAX",
                    "T2M_MIN",
                    "RH2M",
                    "PRECTOTCORR",
                    "ALLSKY_SFC_SW_DWN",
                    "WS2M",
                    "EVLAND",
                ]
            ),
            "community": "AG",
            "longitude": lon,
            "latitude": lat,
            "start": start_date,
            "end": end_date,
            "format": "JSON",
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(
                f"{self.nasa_power_url}/daily/point", params=params
            )
            resp.raise_for_status()
            return resp.json()

    async def get_climate_anomaly(
        self, lat: float, lon: float, current_temp: float | None, current_humidity: float | None
    ) -> dict | None:
        """Compute climate anomaly by comparing current conditions to same month last year.

        Fetches NASA POWER daily data for the same calendar month one year ago,
        computes the monthly mean, and returns the delta vs. current observations.
        Returns None if NASA POWER is unreachable.
        """
        now = datetime.datetime.utcnow()
        # Same month, one year ago
        ref_year = now.year - 1
        ref_month = now.month
        start = f"{ref_year}{ref_month:02d}01"
        # Last day of that month
        if ref_month == 12:
            end_dt = datetime.date(ref_year + 1, 1, 1) - datetime.timedelta(days=1)
        else:
            end_dt = datetime.date(ref_year, ref_month + 1, 1) - datetime.timedelta(days=1)
        end = end_dt.strftime("%Y%m%d")

        try:
            data = await self.get_historical_nasa_power(lat, lon, start, end)
        except Exception:
            return None

        # Extract daily values from NASA POWER response
        params = data.get("properties", {}).get("parameter", {})
        if not params:
            return None

        def _mean_values(key: str) -> list[float]:
            obj = params.get(key, {})
            if isinstance(obj, dict):
                vals = []
                for v in obj.values():
                    try:
                        f = float(v)
                        if f != -999.0:  # NASA POWER fill value
                            vals.append(f)
                    except (ValueError, TypeError):
                        pass
                return vals
            return []

        hist_temps = _mean_values("T2M")
        hist_humidities = _mean_values("RH2M")
        hist_precips = _mean_values("PRECTOTCORR")

        result = {
            "baseline_period": f"{ref_year}-{ref_month:02d}",
            "baseline_source": "NASA POWER (MERRA-2)",
        }

        if hist_temps:
            mean_temp = sum(hist_temps) / len(hist_temps)
            result["historical_mean_temp_c"] = round(mean_temp, 1)
            if current_temp is not None:
                result["temp_anomaly_c"] = round(current_temp - mean_temp, 1)

        if hist_humidities:
            mean_hum = sum(hist_humidities) / len(hist_humidities)
            result["historical_mean_humidity_pct"] = round(mean_hum, 1)
            if current_humidity is not None:
                result["humidity_anomaly_pct"] = round(current_humidity - mean_hum, 1)

        if hist_precips:
            total_precip = sum(hist_precips)
            result["historical_total_precip_mm"] = round(total_precip, 1)
            result["historical_mean_daily_precip_mm"] = round(total_precip / len(hist_precips), 2)

        return result


weather_service = WeatherService()
