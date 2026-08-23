from decimal import Decimal

import pytest

from apps.assessments.models import Assessment, AssessmentResponse
from apps.enterprises.models import Enterprise
from apps.frameworks.models import FrameworkVersion, Question, ResponseOption
from apps.scoring.engine import (
    compute_abi,
    dimension_weighted_contribution,
    resolve_readiness_band,
    round_abi_total,
)
from apps.scoring.exceptions import IncompleteAssessmentError

# --- Worked example from docs/10_SCORING_ENGINE.md ----------------------------
# Financial Performance    60 x 25% = 15.00
# Governance & Management  70 x 15% = 10.50
# Market Strength          75 x 20% = 15.00
# Operational Capacity     65 x 15% =  9.75
# Climate Resilience       50 x 15% =  7.50
# Digital Readiness        40 x 10% =  4.00
#                                    --------
# ABI                                61.75  -> displayed as 62 / 100

WORKED_EXAMPLE = [
    (Decimal("60"), Decimal("25"), Decimal("15.00")),
    (Decimal("70"), Decimal("15"), Decimal("10.50")),
    (Decimal("75"), Decimal("20"), Decimal("15.00")),
    (Decimal("65"), Decimal("15"), Decimal("9.75")),
    (Decimal("50"), Decimal("15"), Decimal("7.50")),
    (Decimal("40"), Decimal("10"), Decimal("4.00")),
]


def test_worked_example_weighted_contributions_are_exact():
    contributions = [
        dimension_weighted_contribution(avg, weight) for avg, weight, _expected in WORKED_EXAMPLE
    ]
    for (_, _, expected), actual in zip(WORKED_EXAMPLE, contributions):
        assert actual == expected


def test_worked_example_totals_61_75_and_rounds_to_62():
    total = sum(
        dimension_weighted_contribution(avg, weight) for avg, weight, _ in WORKED_EXAMPLE
    )
    assert total == Decimal("61.75")
    assert round_abi_total(total) == 62


@pytest.mark.django_db
def test_worked_example_score_resolves_to_developing_bankability(seeded_db):
    fv = FrameworkVersion.objects.get(version_label="0.1")
    band = resolve_readiness_band(62, fv)
    assert band.code == "developing_bankability"
    assert band.label == "Developing Bankability"


@pytest.mark.django_db
@pytest.mark.parametrize(
    "score,expected_code",
    [
        (0, "pre_bankable"),
        (34, "pre_bankable"),
        (35, "early_stage_readiness"),
        (49, "early_stage_readiness"),
        (50, "developing_bankability"),
        (64, "developing_bankability"),
        (65, "finance_ready_conditions"),
        (79, "finance_ready_conditions"),
        (80, "investment_ready"),
        (100, "investment_ready"),
    ],
)
def test_readiness_band_boundaries(seeded_db, score, expected_code):
    fv = FrameworkVersion.objects.get(version_label="0.1")
    band = resolve_readiness_band(score, fv)
    assert band.code == expected_code


@pytest.mark.django_db
def test_demo_enterprises_land_in_intended_bands(seeded_db):
    fv = FrameworkVersion.objects.get(version_label="0.1")

    maundurahuku_assessment = Assessment.objects.get(
        enterprise__code="DEMO-MAUNDURAHUKU", framework_version=fv
    )
    result = compute_abi(maundurahuku_assessment)
    assert result.readiness_band.code == "developing_bankability"

    dim_by_code = {d.dimension.code: d for d in result.dimension_scores}
    assert dim_by_code["market_strength"].raw_average == max(
        d.raw_average for d in result.dimension_scores
    )
    assert dim_by_code["digital_readiness"].raw_average == min(
        d.raw_average for d in result.dimension_scores
    )

    zvemuchando_assessment = Assessment.objects.get(
        enterprise__code="DEMO-ZVEMUCHANDO", framework_version=fv
    )
    result = compute_abi(zvemuchando_assessment)
    assert result.readiness_band.code == "finance_ready_conditions"

    dim_by_code = {d.dimension.code: d for d in result.dimension_scores}
    assert dim_by_code["governance_management"].raw_average == max(
        d.raw_average for d in result.dimension_scores
    )
    assert dim_by_code["climate_resilience"].raw_average == min(
        d.raw_average for d in result.dimension_scores
    )


@pytest.mark.django_db
def test_compute_abi_raises_on_incomplete_assessment(seeded_db):
    fv = FrameworkVersion.objects.get(version_label="0.1")
    enterprise = Enterprise.objects.get(code="DEMO-ZVEMUCHANDO")
    assessment = Assessment.objects.create(enterprise=enterprise, framework_version=fv)

    all_questions = list(Question.objects.filter(dimension__framework_version=fv))
    option = ResponseOption.objects.get(framework_version=fv, scale_value=3)
    for question in all_questions[:-1]:
        AssessmentResponse.objects.create(
            assessment=assessment,
            question=question,
            scale_value=option.scale_value,
            score_value=option.score_value,
        )

    with pytest.raises(IncompleteAssessmentError) as exc_info:
        compute_abi(assessment)

    assert exc_info.value.missing_question_codes == [all_questions[-1].code]


@pytest.mark.django_db
def test_evidence_coverage_percent_reflects_seeded_levels(seeded_db):
    fv = FrameworkVersion.objects.get(version_label="0.1")
    zvemuchando_assessment = Assessment.objects.get(
        enterprise__code="DEMO-ZVEMUCHANDO", framework_version=fv
    )
    result = compute_abi(zvemuchando_assessment)
    # 5 of 6 dimensions seeded with evidence_level >= 2 (all but climate_resilience).
    assert result.evidence_coverage_percent == Decimal("83.33")
