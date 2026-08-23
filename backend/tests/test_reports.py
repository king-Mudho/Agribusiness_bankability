import csv
import io
import re

import pytest

from apps.assessments.models import Assessment
from apps.reports.generators import generate_csv_report, generate_pdf_report

EXPECTED_CSV_HEADERS = [
    "enterprise_name",
    "enterprise_code",
    "value_chain",
    "province",
    "organisation_type",
    "turnover_band",
    "framework_version",
    "fin_01",
    "fin_02",
    "fin_03",
    "fin_04",
    "gov_01",
    "gov_02",
    "gov_03",
    "gov_04",
    "mkt_01",
    "mkt_02",
    "mkt_03",
    "mkt_04",
    "ops_01",
    "ops_02",
    "ops_03",
    "ops_04",
    "cli_01",
    "cli_02",
    "cli_03",
    "cli_04",
    "dig_01",
    "dig_02",
    "dig_03",
    "dig_04",
    "financial_performance_score",
    "governance_management_score",
    "market_strength_score",
    "operational_capacity_score",
    "climate_resilience_score",
    "digital_readiness_score",
    "abi_total_score",
    "readiness_band_code",
    "legal_identity_result",
    "financial_records_result",
    "source_of_repayment_result",
    "market_revenue_opportunity_result",
    "fraud_default_concerns_result",
    "evidence_coverage_percent",
]


def _pdf_page_count(pdf_bytes: bytes) -> int:
    return len(re.findall(rb"/Type\s*/Page[^s]", pdf_bytes))


@pytest.mark.django_db
@pytest.mark.parametrize("enterprise_code", ["DEMO-MAUNDURAHUKU", "DEMO-ZVEMUCHANDO"])
def test_pdf_report_fits_a_single_page(seeded_db, enterprise_code):
    assessment = Assessment.objects.get(enterprise__code=enterprise_code)
    pdf_bytes = generate_pdf_report(assessment)
    assert pdf_bytes[:4] == b"%PDF"
    assert _pdf_page_count(pdf_bytes) == 1


@pytest.mark.django_db
def test_csv_report_matches_documented_column_schema(seeded_db):
    assessment = Assessment.objects.get(enterprise__code="DEMO-ZVEMUCHANDO")
    csv_text = generate_csv_report(assessment)
    reader = csv.reader(io.StringIO(csv_text))
    headers = next(reader)
    assert headers == EXPECTED_CSV_HEADERS

    row = next(reader)
    row_dict = dict(zip(headers, row))
    assert row_dict["enterprise_code"] == "DEMO-ZVEMUCHANDO"
    assert row_dict["framework_version"] == "0.1"
    assert row_dict["readiness_band_code"] == "finance_ready_conditions"
    assert row_dict["fin_01"] != ""
