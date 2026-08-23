import pytest

from apps.assessments.models import Assessment
from apps.scoring.services import score_assessment


@pytest.mark.django_db
def test_score_assessment_persists_scores_and_marks_scored(seeded_db):
    assessment = Assessment.objects.get(enterprise__code="DEMO-MAUNDURAHUKU")

    abi_score = score_assessment(assessment)

    assessment.refresh_from_db()
    assert assessment.status == Assessment.Status.SCORED
    assert abi_score.readiness_band_code == "developing_bankability"
    assert assessment.dimension_scores.count() == 6
    assert assessment.abi_score.total_score == abi_score.total_score


@pytest.mark.django_db
def test_score_assessment_is_idempotent(seeded_db):
    assessment = Assessment.objects.get(enterprise__code="DEMO-ZVEMUCHANDO")

    first = score_assessment(assessment)
    second = score_assessment(assessment)

    assert first.pk == second.pk
    assert assessment.dimension_scores.count() == 6
