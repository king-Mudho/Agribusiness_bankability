from django.db import transaction

from apps.assessments.models import Assessment

from .engine import SCORING_ENGINE_VERSION, compute_abi
from .models import ABIScore, DimensionScore


@transaction.atomic
def score_assessment(assessment) -> ABIScore:
    """Runs compute_abi() and persists DimensionScore/ABIScore, marking the
    assessment SCORED. Raises IncompleteAssessmentError if any question is
    unanswered -- callers (the submit view) must not catch that away.
    """
    result = compute_abi(assessment)

    DimensionScore.objects.filter(assessment=assessment).delete()
    for dim_result in result.dimension_scores:
        DimensionScore.objects.create(
            assessment=assessment,
            dimension=dim_result.dimension,
            raw_average=dim_result.raw_average,
            weighted_contribution=dim_result.weighted_contribution,
        )

    abi_score, _ = ABIScore.objects.update_or_create(
        assessment=assessment,
        defaults={
            "total_score": result.total_score,
            "readiness_band_code": result.readiness_band.code,
            "evidence_coverage_percent": result.evidence_coverage_percent,
            "scoring_engine_version": SCORING_ENGINE_VERSION,
        },
    )

    if assessment.status != Assessment.Status.SCORED:
        assessment.status = Assessment.Status.SCORED
        assessment.save(update_fields=["status"])

    return abi_score
