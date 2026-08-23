import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Role, User


@pytest.fixture
def api_client():
    return APIClient()


def _make_user(username, role_name, password="TestPass123!"):
    role, _ = Role.objects.get_or_create(name=role_name)
    return User.objects.create_user(username=username, password=password, role=role)


def _login(api_client, username, password="TestPass123!"):
    resp = api_client.post(
        "/api/v1/auth/token/", {"username": username, "password": password}, format="json"
    )
    assert resp.status_code == 200, resp.data
    return resp.data["access"]


@pytest.mark.django_db
def test_dashboard_requires_authentication(api_client, seeded_db):
    resp = api_client.get("/api/v1/research/dashboard/")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_dashboard_rejects_data_collector_role(api_client, seeded_db):
    _make_user("dc_user", Role.DATA_COLLECTOR)
    token = _login(api_client, "dc_user")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    resp = api_client.get("/api/v1/research/dashboard/")
    assert resp.status_code == 403


@pytest.mark.django_db
@pytest.mark.parametrize("role_name", [Role.ANALYST, Role.RESEARCHER, Role.ADMIN])
def test_dashboard_allows_analyst_researcher_admin(api_client, seeded_db, role_name):
    _make_user(f"user_{role_name.lower()}", role_name)
    token = _login(api_client, f"user_{role_name.lower()}")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    resp = api_client.get("/api/v1/research/dashboard/")
    assert resp.status_code == 200


@pytest.mark.django_db
def test_expert_review_requires_researcher_or_admin(api_client, seeded_db):
    from apps.frameworks.models import FrameworkVersion

    fv = FrameworkVersion.objects.get(version_label="0.1")
    payload = {
        "framework_version": fv.version_label,
        "reviewer_name": "Dr Test",
        "comments": "Looks solid.",
    }

    resp = api_client.post("/api/v1/research/expert-review/", payload, format="json")
    assert resp.status_code == 401

    _make_user("analyst_only", Role.ANALYST)
    token = _login(api_client, "analyst_only")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    resp = api_client.post("/api/v1/research/expert-review/", payload, format="json")
    assert resp.status_code == 403

    api_client.credentials()
    _make_user("researcher_1", Role.RESEARCHER)
    token = _login(api_client, "researcher_1")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    resp = api_client.post("/api/v1/research/expert-review/", payload, format="json")
    assert resp.status_code == 201


@pytest.mark.django_db
def test_token_refresh_works(api_client, seeded_db):
    _make_user("refresh_user", Role.ADMIN)
    resp = api_client.post(
        "/api/v1/auth/token/", {"username": "refresh_user", "password": "TestPass123!"}, format="json"
    )
    refresh_token = resp.data["refresh"]
    resp = api_client.post("/api/v1/auth/token/refresh/", {"refresh": refresh_token}, format="json")
    assert resp.status_code == 200
    assert "access" in resp.data
