from django.db import models

from apps.assessments.models import Assessment
from apps.frameworks.models import Dimension, Question


class EvidenceRecord(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="evidence_records"
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="evidence_records",
        null=True,
        blank=True,
    )
    dimension = models.ForeignKey(
        Dimension,
        on_delete=models.CASCADE,
        related_name="evidence_records",
        null=True,
        blank=True,
    )
    evidence_level = models.PositiveSmallIntegerField()
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        target = self.question.code if self.question_id else self.dimension.code
        return f"Evidence[{target}] = {self.evidence_level}"
