from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import Department, Employee


def test_read_departments(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/departments/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


def test_create_department(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    data = {
        "name": "Quality Assurance",
        "code": "QA",
        "description": "Software Testing & Automation Quality Assurance",
    }
    response = client.post(
        f"{settings.API_V1_STR}/departments/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["code"] == data["code"]


def test_read_employees(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/employees/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


def test_attendance_check_in_out(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    # Check In
    response = client.post(
        f"{settings.API_V1_STR}/attendance/check-in",
        headers=superuser_token_headers,
    )
    assert response.status_code in [200, 400]  # 400 if already checked in

    # Check Out
    response_out = client.post(
        f"{settings.API_V1_STR}/attendance/check-out",
        headers=superuser_token_headers,
    )
    assert response_out.status_code in [200, 400]


def test_dashboard_stats(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/dashboard/stats",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "total_employees" in content
    assert "attendance_rate" in content
