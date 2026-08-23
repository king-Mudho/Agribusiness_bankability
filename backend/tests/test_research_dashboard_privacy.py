"""
docs/18_DATA_PRIVACY.md: the public/aggregate dashboard must never expose an
individual enterprise's name or unbanded financial figures. This is a hard
requirement enforced by an automated test, not just a visual check --
docs/26_DEFINITION_OF_DONE.md § Non-negotiables.
"""

import json

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.enterprises.models import Enterprise


@pytest.fixture
def analyst_client(seeded_db):
    role, _ = Role.objects.get_or_create(name=Role.ANALYST)
    User.objects.create_user(username="privacy_analyst", password="TestPass123!", role=role)
    client = APIClient()
    token = client.post(
        "/api/v1/auth/token/",
        {"username": "privacy_analyst", "password": "TestPass123!"},
        format="json",
    ).data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.mark.django_db
def test_dashboard_never_exposes_enterprise_names(analyst_client):
    resp = analyst_client.get("/api/v1/research/dashboard/")
    assert resp.status_code == 200

    payload_text = json.dumps(resp.data)

    for enterprise in Enterprise.objects.all():
        assert enterprise.name not in payload_text, f"Leaked enterprise name: {enterprise.name}"
        profile = getattr(enterprise, "profile", None)
        if profile is not None:
            exact_amount = str(profile.finance_required_amount)
            assert exact_amount not in payload_text, f"Leaked exact finance amount: {exact_amount}"


@pytest.mark.django_db
def test_dashboard_payload_only_uses_expected_top_level_keys(analyst_client):
    resp = analyst_client.get("/api/v1/research/dashboard/")
    allowed_keys = {
        "total_assessments",
        "average_abi",
        "band_percentages",
        "abi_distribution",
        "average_score_by_dimension",
        "by_value_chain",
        "by_province",
        "financing_needs_breakdown",
        "most_common_gaps",
        "evidence_coverage_average",
        "critical_gate_failure_frequency",
        "caption",
    }
    assert set(resp.data.keys()) == allowed_keys
    assert "national benchmark" in resp.data["caption"]
