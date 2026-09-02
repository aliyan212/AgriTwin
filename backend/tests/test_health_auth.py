"""Tests for health check and authentication endpoints."""

import pytest


def test_health_check(client):
    """Test that the system health check returns status ok."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_docs_available(client):
    """Test that OpenAPI interactive documentation is reachable."""
    response = client.get("/docs")
    assert response.status_code == 200


def test_user_registration_and_login_flow(client):
    """Test end-to-end user registration, duplicate rejection, login, and profile fetching."""
    user_payload = {
        "name": "Chaudhry Tariq Gujjar",
        "email": "tariq.gujjar@agritwin.pk",
        "phone": "+923001234567",
        "password": "StrongSecretPassword123!",
    }

    # 1. Register new user
    reg_response = client.post("/api/v1/auth/register", json=user_payload)
    assert reg_response.status_code == 201
    user_data = reg_response.json()
    assert user_data["email"] == user_payload["email"]
    assert user_data["name"] == user_payload["name"]
    assert "id" in user_data

    # 2. Reject duplicate registration with same email
    dup_response = client.post("/api/v1/auth/register", json=user_payload)
    assert dup_response.status_code == 400
    assert "already registered" in dup_response.json()["detail"].lower()

    # 3. Reject invalid login credentials
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": user_payload["email"], "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401

    # 4. Successful login and token issuance
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": user_payload["email"], "password": user_payload["password"]},
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == user_payload["email"]

    # 5. Access /auth/me with Bearer token
    token = token_data["access_token"]
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == user_payload["email"]
    assert me_data["name"] == user_payload["name"]
