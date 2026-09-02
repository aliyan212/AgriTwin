"""Tests for Farm and Crop CRUD operations."""

import json
import pytest


def test_create_and_get_farm(client):
    """Test creating a farm with boundary geometry and retrieving it."""
    geojson_polygon = json.dumps({
        "type": "Polygon",
        "coordinates": [[
            [71.5200, 30.1500],
            [71.5250, 30.1500],
            [71.5250, 30.1550],
            [71.5200, 30.1550],
            [71.5200, 30.1500]
        ]]
    })

    farm_payload = {
        "name": "Chak 45 Multan Cotton Twin",
        "district": "Multan",
        "province": "Punjab",
        "latitude": 30.1525,
        "longitude": 71.5225,
        "area_acres": 15.5,
        "geometry_geojson": geojson_polygon,
    }

    # 1. Create farm
    create_res = client.post("/api/v1/farms/", json=farm_payload)
    assert create_res.status_code == 201
    farm_data = create_res.json()
    assert farm_data["name"] == farm_payload["name"]
    assert farm_data["district"] == "Multan"
    assert farm_data["area_acres"] == 15.5
    farm_id = farm_data["id"]

    # 2. Get farm by ID
    get_res = client.get(f"/api/v1/farms/{farm_id}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["id"] == farm_id
    assert retrieved["name"] == farm_payload["name"]

    # 3. Verify farm appears in list
    list_res = client.get("/api/v1/farms/")
    assert list_res.status_code == 200
    farms_list = list_res.json()
    assert any(f["id"] == farm_id for f in farms_list)

    # 4. Add crop to farm with automatic phenology calculation
    crop_payload = {
        "crop_name": "Wheat",
        "season": "Rabi",
        "sowing_date": "2025-11-15",
    }
    crop_res = client.post(f"/api/v1/farms/{farm_id}/crops", json=crop_payload)
    assert crop_res.status_code == 201
    crop_data = crop_res.json()
    assert crop_data["crop_name"] == "Wheat"
    assert crop_data["growth_stage"] is not None  # Auto-derived from sowing date!

    # 5. List crops for farm
    list_crops_res = client.get(f"/api/v1/farms/{farm_id}/crops")
    assert list_crops_res.status_code == 200
    assert len(list_crops_res.json()) >= 1

    # 6. Delete farm
    del_res = client.delete(f"/api/v1/farms/{farm_id}")
    assert del_res.status_code == 204

    # 7. Verify farm is gone (404)
    after_del_res = client.get(f"/api/v1/farms/{farm_id}")
    assert after_del_res.status_code == 404

