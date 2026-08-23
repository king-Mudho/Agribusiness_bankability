from decimal import Decimal

import pytest

from apps.assessments.models import Assessment
from apps.enterprises.models import Enterprise
from apps.frameworks.models import Dimension, FrameworkVersion
from apps.recommendations.models import AssessmentRecommendation
from apps.recommendations.services import generate_recommendations, select_gap_dimensions
from apps.scoring.models import DimensionScore


def _make_dimension_score(assessment, dimension, raw_average):
    return DimensionScore.objects.create(
        assessment=assessment,
        dimension=dimension,
        raw_average=Decimal(raw_average),
        weighted_contribution=Decimal(raw_average) * dimension.weight_percent / Decimal(100),
    )


@pytest.fixture
def fixture_assessment(seeded_db):
    fv = FrameworkVersion.objects.get(version_label="0.1")
    enterprise = Enterprise.objects.get(code="DEMO-MAUNDURAHUKU")
    assessment = Assessment.objects.create(enterprise=enterprise, framework_version=fv)

    raw_averages = {
        "financial_performance": 80,
        "governance_management": 55,
        "market_strength": 90,
        "operational_capacity": 30,
        "climate_resilience": 45,
        "digital_readiness": 70,
    }
    dimension_scores = [
        _make_dimension_score(assessment, Dimension.objects.get(framework_version=fv, code=code), avg)
        for code, avg in raw_averages.items()
    ]
    return assessment, dimension_scores


@pytest.mark.django_db
def test_select_gap_dimensions_picks_below_threshold(fixture_assessment):
    _assessment, dimension_scores = fixture_assessment
    selected = select_gap_dimensions(dimension_scores)
    codes = [ds.dimension.code for ds in selected]
    assert codes == ["operational_capacity", "climate_resilience", "governance_management"]


@pytest.mark.django_db
def test_select_gap_dimensions_falls_back_to_minimum_two(seeded_db):
    fv = FrameworkVersion.objects.get(version_label="0.1")
    enterprise = Enterprise.objects.get(code="DEMO-ZVEMUCHANDO")
    assessment = Assessment.objects.create(enterprise=enterprise, framework_version=fv)

    raw_averages = {
        "financial_performance": 90,
        "governance_management": 85,
        "market_strength": 95,
        "operational_capacity": 70,
        "climate_resilience": 65,
        "digital_readiness": 60,
    }
    dimension_scores = [
        _make_dimension_score(assessment, Dimension.objects.get(framework_version=fv, code=code), avg)
        for code, avg in raw_averages.items()
    ]

    selected = select_gap_dimensions(dimension_scores)
    codes = [ds.dimension.code for ds in selected]
    # None fall below 60 -- fall back to the two lowest-scoring dimensions overall.
    assert codes == ["digital_readiness", "climate_resilience"]


@pytest.mark.django_db
def test_generate_recommendations_orders_by_weight_times_gap(fixture_assessment):
    assessment, dimension_scores = fixture_assessment

    generate_recommendations(assessment, dimension_scores)

    rows = list(
        AssessmentRecommendation.objects.filter(assessment=assessment)
        .select_related("recommendation__dimension")
        .order_by("priority_rank")
    )
    assert len(rows) == 9  # 3 gap dimensions x 3 recommendations each

    dimension_order = []
    for row in rows:
        code = row.recommendation.dimension.code
        if code not in dimension_order:
            dimension_order.append(code)
    # operational_capacity: weight 15 x gap 30 = 450 (most urgent)
    # climate_resilience:   weight 15 x gap 15 = 225
    # governance_management: weight 15 x gap 5 = 75 (least urgent)
    assert dimension_order == ["operational_capacity", "climate_resilience", "governance_management"]


@pytest.mark.django_db
def test_generate_recommendations_is_idempotent_on_rescore(fixture_assessment):
    assessment, dimension_scores = fixture_assessment
    generate_recommendations(assessment, dimension_scores)
    generate_recommendations(assessment, dimension_scores)
    assert AssessmentRecommendation.objects.filter(assessment=assessment).count() == 9
