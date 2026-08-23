from decimal import Decimal

import pytest

from apps.assessments.models import Assessment
from apps.enterprises.models import Enterprise
from apps.financing.models import AssessmentFinancingPathway
from apps.financing.services import generate_financing_pathways, select_financing_pathways
from apps.frameworks.models import Dimension, FrameworkVersion
from apps.scoring.models import DimensionScore


def _make_dimension_score(assessment, dimension, raw_average):
    return DimensionScore.objects.create(
        assessment=assessment,
        dimension=dimension,
        raw_average=Decimal(raw_average),
        weighted_contribution=Decimal(raw_average) * dimension.weight_percent / Decimal(100),
    )


@pytest.fixture
def gap_market_and_climate(seeded_db):
    """market_strength and climate_resilience are the two priority gaps;
    everything else scores comfortably above the gap threshold.
    """
    fv = FrameworkVersion.objects.get(version_label="0.1")
    enterprise = Enterprise.objects.get(code="DEMO-MAUNDURAHUKU")
    assessment = Assessment.objects.create(enterprise=enterprise, framework_version=fv)

    raw_averages = {
        "financial_performance": 65,
        "governance_management": 70,
        "market_strength": 40,
        "operational_capacity": 65,
        "climate_resilience": 45,
        "digital_readiness": 65,
    }
    dimension_scores = [
        _make_dimension_score(assessment, Dimension.objects.get(framework_version=fv, code=code), avg)
        for code, avg in raw_averages.items()
    ]
    return assessment, dimension_scores


@pytest.mark.django_db
def test_select_financing_pathways_filters_by_band(gap_market_and_climate):
    assessment, dimension_scores = gap_market_and_climate

    ranked = select_financing_pathways(assessment, "investment_ready", dimension_scores)
    codes = {p.code for p in ranked}
    # investment_ready suited pathways per docs/13_FINANCING_PATHWAYS.md.
    assert codes == {"working_capital_facility", "equity_investment"}


@pytest.mark.django_db
def test_select_financing_pathways_boosts_gap_matches_first(gap_market_and_climate):
    assessment, dimension_scores = gap_market_and_climate

    ranked = select_financing_pathways(assessment, "developing_bankability", dimension_scores)
    codes = [p.code for p in ranked]

    assert len(ranked) == 5  # top_n cap; 6 candidates suited to this band
    # Both documented boost examples land first (alphabetical among themselves).
    assert codes[0] == "contract_value_chain_finance"
    assert codes[1] == "insurance_linked_finance"
    # Non-boosted candidates follow, alphabetically by name; the band has 6
    # suited pathways so the 6th (Warehouse receipt finance) is cut by top_n.
    assert "warehouse_receipt_finance" not in codes
    assert codes[2:] == ["asset_finance", "blended_finance", "patient_capital"]


@pytest.mark.django_db
def test_generate_financing_pathways_persists_ranked_rows(gap_market_and_climate):
    assessment, dimension_scores = gap_market_and_climate

    generate_financing_pathways(assessment, "developing_bankability", dimension_scores)

    rows = list(
        AssessmentFinancingPathway.objects.filter(assessment=assessment).order_by("relevance_rank")
    )
    assert len(rows) == 5
    assert rows[0].pathway.code == "contract_value_chain_finance"
    assert rows[0].relevance_rank == 1


@pytest.mark.django_db
def test_generate_financing_pathways_is_idempotent_on_rescore(gap_market_and_climate):
    assessment, dimension_scores = gap_market_and_climate
    generate_financing_pathways(assessment, "developing_bankability", dimension_scores)
    generate_financing_pathways(assessment, "developing_bankability", dimension_scores)
    assert AssessmentFinancingPathway.objects.filter(assessment=assessment).count() == 5
