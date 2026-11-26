"""Frontend admin portal API (/api/v1/admin/*), /auth/me/, the new report
types (Excel, certificate) and results insights.

Access rule (docs/18_DATA_PRIVACY.md): the portal exposes other enterprises'
individual records, so every /admin/* endpoint is Admin-only.
"""

import csv
import io

import pytest
from openpyxl import load_workbook
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.assessments.models import Assessment
from apps.audit.models import AuditLog

LIST_ENDPOINTS = [
    "/api/v1/admin/overview/",
    "/api/v1/admin/assessments/",
    "/api/v1/admin/enterprises/",
    "/api/v1/admin/reports/",
    "/api/v1/admin/feedback/",
    "/api/v1/admin/expert-reviews/",
    "/api/v1/admin/pretest-notes/",
    "/api/v1/admin/audit-log/",
    "/api/v1/admin/users/",
    "/api/v1/admin/frameworks/",
]


def _client_as(role_name, username):
    role, _ = Role.objects.get_or_create(name=role_name)
    user = User.objects.create_user(username=username, password="TestPass123!", role=role)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _scored():
    return Assessment.objects.filter(abi_score__isnull=False).first()


@pytest.mark.django_db
@pytest.mark.parametrize("url", LIST_ENDPOINTS)
def test_portal_requires_authentication(seeded_db, url):
    assert APIClient().get(url).status_code == 401


@pytest.mark.django_db
@pytest.mark.parametrize("role_name", [Role.ANALYST, Role.RESEARCHER, Role.DATA_COLLECTOR, Role.VIEWER])
def test_portal_rejects_non_admin_roles(seeded_db, role_name):
    client = _client_as(role_name, f"user_{role_name.lower()}")
    for url in LIST_ENDPOINTS + ["/api/v1/admin/export/assessments/"]:
        assert client.get(url).status_code == 403, url


@pytest.mark.django_db
@pytest.mark.parametrize("url", LIST_ENDPOINTS)
def test_portal_endpoints_work_for_admin(seeded_db, url):
    resp = _client_as(Role.ADMIN, "portal_admin").get(url)
    assert resp.status_code == 200


@pytest.mark.django_db
def test_admin_assessment_list_has_scores_and_filters(seeded_db):
    client = _client_as(Role.ADMIN, "portal_admin")
    data = client.get("/api/v1/admin/assessments/").data
    assert data["count"] == Assessment.objects.count()
    row = next(r for r in data["results"] if r["abi_score"] is not None)
    assert row["readiness_band_label"]
    filtered = client.get("/api/v1/admin/assessments/", {"q": row["enterprise_code"]}).data
    assert all(r["enterprise_code"] == row["enterprise_code"] for r in filtered["results"])


@pytest.mark.django_db
def test_me_endpoint_reports_role(seeded_db):
    assert APIClient().get("/api/v1/auth/me/").status_code == 401
    data = _client_as(Role.ADMIN, "me_admin").get("/api/v1/auth/me/").data
    assert data["username"] == "me_admin"
    assert data["role"] == Role.ADMIN


@pytest.mark.django_db
@pytest.mark.parametrize("file_type", ["csv", "xlsx"])
def test_admin_export_assessments(seeded_db, file_type):
    client = _client_as(Role.ADMIN, "export_admin")
    resp = client.get("/api/v1/admin/export/assessments/", {"file_type": file_type})
    assert resp.status_code == 200
    assert "attachment;" in resp["Content-Disposition"]
    scored = Assessment.objects.filter(abi_score__isnull=False).count()
    if file_type == "csv":
        rows = list(csv.DictReader(io.StringIO(resp.content.decode("utf-8"))))
        assert len(rows) == scored
    else:
        wb = load_workbook(io.BytesIO(resp.content))
        assert wb.sheetnames == ["Assessments", "Disclaimer"]
        assert wb["Assessments"].max_row == scored + 1
    log = AuditLog.objects.get(action="assessments.exported")
    assert log.metadata["count"] == scored


@pytest.mark.django_db
@pytest.mark.parametrize("dataset", ["enterprises", "feedback"])
def test_admin_export_other_datasets(seeded_db, dataset):
    resp = _client_as(Role.ADMIN, "export_admin").get(
        f"/api/v1/admin/export/{dataset}/", {"file_type": "xlsx"}
    )
    assert resp.status_code == 200
    assert AuditLog.objects.filter(action=f"{dataset}.exported").exists()


@pytest.mark.django_db
def test_admin_export_rejects_bad_input(seeded_db):
    client = _client_as(Role.ADMIN, "export_admin")
    assert client.get("/api/v1/admin/export/nope/").status_code == 404
    assert client.get("/api/v1/admin/export/assessments/", {"file_type": "pdf"}).status_code == 400


@pytest.mark.django_db
@pytest.mark.parametrize(
    "report_type,magic",
    [("XLSX", b"PK"), ("CERT", b"%PDF"), ("PDF", b"%PDF"), ("CSV", b"enterprise_name")],
)
def test_report_types_generate_and_download(seeded_db, report_type, magic):
    assessment = _scored()
    client = APIClient()
    resp = client.post(
        "/api/v1/reports/", {"assessment": str(assessment.pk), "report_type": report_type}, format="json"
    )
    assert resp.status_code == 201, resp.data
    download = client.get(f"/api/v1/reports/{resp.data['id']}/download/")
    assert download.status_code == 200
    assert b"".join(download.streaming_content).startswith(magic)


@pytest.mark.django_db
def test_unknown_report_type_rejected(seeded_db):
    resp = APIClient().post(
        "/api/v1/reports/", {"assessment": str(_scored().pk), "report_type": "DOCX"}, format="json"
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_results_include_insights(seeded_db):
    assessment = _scored()
    data = APIClient().get(f"/api/v1/assessments/{assessment.pk}/results/").data
    insights = data["insights"]
    assert set(insights) == {"next_band", "improvement_potential", "peer_benchmark", "min_peer_sample"}
    potentials = [r["potential_points"] for r in insights["improvement_potential"]]
    assert potentials == sorted(potentials, reverse=True)
    assert len(potentials) == len(data["dimension_scores"])
    # Potential gain = weight * (100 - score) / 100, from the framework data.
    for row in insights["improvement_potential"]:
        assert row["potential_points"] == pytest.approx(row["weight_percent"] * (100 - row["score"]) / 100, abs=0.06)
    if insights["next_band"]:
        assert insights["next_band"]["min_score"] > data["abi_score"]
    peer = insights["peer_benchmark"]
    if peer:
        assert peer["sample_size"] >= insights["min_peer_sample"]
