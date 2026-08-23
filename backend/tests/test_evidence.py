import pytest
from django.core.exceptions import ValidationError

from apps.assessments.models import Assessment
from apps.evidence.models import EvidenceRecord
from apps.frameworks.models import Dimension, FrameworkVersion, Question


@pytest.mark.django_db
def test_evidence_record_requires_exactly_one_target(seeded_db):
    fv = FrameworkVersion.objects.get(version_label="0.1")
    assessment = Assessment.objects.filter(framework_version=fv).first()
    dimension = Dimension.objects.filter(framework_version=fv).first()
    question = Question.objects.filter(dimension=dimension).first()

    neither = EvidenceRecord(assessment=assessment, evidence_level=2)
    with pytest.raises(ValidationError):
        neither.clean()

    both = EvidenceRecord(
        assessment=assessment, question=question, dimension=dimension, evidence_level=2
    )
    with pytest.raises(ValidationError):
        both.clean()

    only_question = EvidenceRecord(assessment=assessment, question=question, evidence_level=2)
    only_question.clean()  # should not raise

    only_dimension = EvidenceRecord(assessment=assessment, dimension=dimension, evidence_level=2)
    only_dimension.clean()  # should not raise
