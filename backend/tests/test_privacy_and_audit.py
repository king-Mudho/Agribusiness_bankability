"""
docs/18_DATA_PRIVACY.md: consent must block assessment persistence, and
AuditLog must record assessment submission, report generation, gate
overrides and framework version changes. See also
tests/test_research_dashboard_privacy.py for the aggregate-dashboard rule.
"""

import pytest
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.frameworks.models import FrameworkVersion


@pytest.mark.django_db
def test_starting_assessment_without_consent_is_rejected(seeded_db):
    client = APIClient()
    resp = client.post(
        "/api/v1/enterprises/",
        {
            "name": "No Consent Farm",
            "organisation_type": "COOPERATIVE",
            "value_chain": "GRAIN",
            "province": "HARARE",
            "district": "",
            "years_operating": 3,
            "workers_count": 5,
            "turnover_band": "UNDER_10K",
            "profile": {
                "finance_required_amount": "5000.00",
                "finance_type_sought": "WORKING_CAPITAL",
                "preferred_financier_type": "BANK",
                # consent_given intentionally omitted -> defaults to False
            },
        },
        format="json",
    )
    assert resp.status_code == 201
    enterprise_id = resp.data["id"]
    assert resp.data["profile"]["consent_given"] is False

    resp = client.post("/api/v1/assessments/", {"enterprise": enterprise_id}, format="json")
    assert resp.status_code == 400
    assert "enterprise" in resp.data["error"]["field_errors"]


@pytest.mark.django_db
def test_starting_assessment_with_consent_succeeds(seeded_db):
    client = APIClient()
    resp = client.post(
        "/api/v1/enterprises/",
        {
            "name": "Consented Farm",
            "organisation_type": "COOPERATIVE",
            "value_chain": "GRAIN",
            "province": "HARARE",
            "district": "",
            "years_operating": 3,
            "workers_count": 5,
            "turnover_band": "UNDER_10K",
            "profile": {
                "finance_required_amount": "5000.00",
                "finance_type_sought": "WORKING_CAPITAL",
                "preferred_financier_type": "BANK",
                "consent_given": True,
            },
        },
        format="json",
    )
    enterprise_id = resp.data["id"]
    resp = client.post("/api/v1/assessments/", {"enterprise": enterprise_id}, format="json")
    assert resp.status_code == 201


@pytest.mark.django_db
def test_audit_log_records_assessment_submission(seeded_db):
    from apps.assessments.models import Assessment
    from apps.assessments.services import submit_assessment

    assessment = Assessment.objects.get(enterprise__code="DEMO-MAUNDURAHUKU")
    submit_assessment(assessment)
    assert AuditLog.objects.filter(action="assessment.submitted", object_id=str(assessment.pk)).exists()


@pytest.mark.django_db
def test_audit_log_records_gate_submission(seeded_db):
    from apps.assessments.models import Assessment
    from apps.assessments.services import upsert_gates

    assessment = Assessment.objects.get(enterprise__code="DEMO-ZVEMUCHANDO")
    upsert_gates(assessment, [{"gate_code": "legal_identity", "result": "CAUTION", "note": "re-check"}])
    assert AuditLog.objects.filter(
        action="assessment.gate_recorded", object_id=str(assessment.pk)
    ).exists()


@pytest.mark.django_db
def test_audit_log_records_report_generation(seeded_db):
    from apps.assessments.models import Assessment
    from apps.reports.models import Report

    assessment = Assessment.objects.get(enterprise__code="DEMO-ZVEMUCHANDO")
    client = APIClient()
    resp = client.post(
        "/api/v1/reports/", {"assessment": str(assessment.pk), "report_type": "CSV"}, format="json"
    )
    assert resp.status_code == 201
    report_id = resp.data["id"]
    assert AuditLog.objects.filter(action="report.generated", object_id=report_id).exists()
    assert Report.objects.filter(pk=report_id).exists()


@pytest.mark.django_db
def test_audit_log_records_framework_version_creation(seeded_db):
    fv = FrameworkVersion.objects.get(version_label="0.1")
    assert AuditLog.objects.filter(
        action="framework_version.created", object_id=str(fv.pk)
    ).exists()


@pytest.mark.django_db
def test_enterprise_list_is_not_publicly_readable(seeded_db):
    """docs/18_DATA_PRIVACY.md / docs/06_API_ARCHITECTURE.md: public respondent
    flows "must not leak other enterprises' data". A public respondent may
    only read their own enterprise by id/link -- GET /enterprises/ (list) must
    not hand every visitor every other enterprise's name and exact finance
    figures.
    """
    from apps.accounts.models import Role, User

    client = APIClient()
    resp = client.get("/api/v1/enterprises/")
    assert resp.status_code == 401

    role, _ = Role.objects.get_or_create(name=Role.ANALYST)
    User.objects.create_user(username="list_analyst", password="TestPass123!", role=role)
    token = client.post(
        "/api/v1/auth/token/", {"username": "list_analyst", "password": "TestPass123!"}, format="json"
    ).data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    resp = client.get("/api/v1/enterprises/")
    assert resp.status_code == 403

    admin_role, _ = Role.objects.get_or_create(name=Role.ADMIN)
    User.objects.create_user(username="list_admin", password="TestPass123!", role=admin_role)
    admin_token = client.post(
        "/api/v1/auth/token/", {"username": "list_admin", "password": "TestPass123!"}, format="json"
    ).data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    resp = client.get("/api/v1/enterprises/")
    assert resp.status_code == 200

    # Retrieving one's own enterprise by id, and creating a new one, stay
    # public -- only bulk listing is locked down.
    client.credentials()
    resp = client.post(
        "/api/v1/enterprises/",
        {
            "name": "Retrieve Check Farm",
            "organisation_type": "COOPERATIVE",
            "value_chain": "GRAIN",
            "province": "HARARE",
            "district": "",
            "years_operating": 2,
            "workers_count": 4,
            "turnover_band": "UNDER_10K",
            "profile": {
                "finance_required_amount": "1000.00",
                "finance_type_sought": "WORKING_CAPITAL",
                "preferred_financier_type": "BANK",
            },
        },
        format="json",
    )
    assert resp.status_code == 201
    enterprise_id = resp.data["id"]
    resp = client.get(f"/api/v1/enterprises/{enterprise_id}/")
    assert resp.status_code == 200
