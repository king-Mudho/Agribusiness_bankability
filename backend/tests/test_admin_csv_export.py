"""Admin-only bulk CSV export of assessments (Django admin action
"Export selected assessments to CSV"). Bulk access to other enterprises'
individual assessments is Admin-only per docs/18_DATA_PRIVACY.md, and the
columns match the per-assessment CSV report in
docs/16_REPORTING_SPECIFICATION.md.
"""

import csv
import io

import pytest
from django.test import Client

from apps.accounts.models import Role, User
from apps.assessments.models import Assessment
from apps.audit.models import AuditLog
from apps.reports.generators import generate_csv_export, generate_csv_report
from config.disclaimers import RESEARCH_PROTOTYPE_DISCLAIMER

CHANGELIST = "/django-admin/assessments/assessment/"


def _staff(username, role_name, superuser=False):
    role, _ = Role.objects.get_or_create(name=role_name)
    return User.objects.create_user(
        username=username,
        password="TestPass123!",
        role=role,
        is_staff=True,
        is_superuser=superuser,
    )


def _post_action(client, ids):
    return client.post(
        CHANGELIST,
        {"action": "export_csv", "_selected_action": [str(i) for i in ids]},
    )


def _scored():
    return list(Assessment.objects.filter(abi_score__isnull=False).order_by("submitted_at"))


@pytest.mark.django_db
def test_admin_can_export_selected_assessments(seeded_db):
    scored = _scored()
    assert scored, "seed data should include at least one scored assessment"

    client = Client()
    client.force_login(_staff("export_admin", Role.ADMIN, superuser=True))
    resp = _post_action(client, [a.pk for a in scored])

    assert resp.status_code == 200
    assert resp["Content-Type"].startswith("text/csv")
    assert "attachment;" in resp["Content-Disposition"]

    rows = list(csv.DictReader(io.StringIO(resp.content.decode("utf-8"))))
    assert len(rows) == len(scored)
    assert {r["enterprise_code"] for r in rows} == {a.enterprise.code for a in scored}
    assert all(r["disclaimer"] == RESEARCH_PROTOTYPE_DISCLAIMER for r in rows)

    log = AuditLog.objects.get(action="assessments.exported")
    assert log.metadata["count"] == len(scored)


@pytest.mark.django_db
def test_export_skips_unscored_assessments(seeded_db):
    # The seed only contains scored assessments, so un-score one to get a
    # mixed selection.
    all_scored = _scored()
    all_scored[-1].abi_score.delete()
    scored = _scored()
    unscored = list(Assessment.objects.filter(abi_score__isnull=True))
    assert scored and unscored

    client = Client()
    client.force_login(_staff("export_admin2", Role.ADMIN, superuser=True))
    resp = _post_action(client, [a.pk for a in scored + unscored])

    rows = list(csv.DictReader(io.StringIO(resp.content.decode("utf-8"))))
    assert len(rows) == len(scored)
    assert AuditLog.objects.get(action="assessments.exported").metadata["skipped_unscored"] == len(
        unscored
    )


@pytest.mark.django_db
def test_export_action_hidden_from_non_admin_staff(seeded_db):
    scored = _scored()
    client = Client()
    # A researcher with full Django model permissions still must not bulk-export.
    client.force_login(_staff("export_researcher", Role.RESEARCHER, superuser=True))

    changelist = client.get(CHANGELIST)
    assert changelist.status_code == 200
    assert b"export_csv" not in changelist.content

    resp = _post_action(client, [a.pk for a in scored])
    assert not resp["Content-Type"].startswith("text/csv")
    assert not AuditLog.objects.filter(action="assessments.exported").exists()


@pytest.mark.django_db
def test_bulk_export_rows_match_single_report(seeded_db):
    assessment = _scored()[0]
    single = generate_csv_report(assessment)
    bulk = generate_csv_export([assessment])
    assert bulk == single


@pytest.mark.django_db
def test_bulk_export_rejects_empty_selection(seeded_db):
    with pytest.raises(ValueError):
        generate_csv_export([])
