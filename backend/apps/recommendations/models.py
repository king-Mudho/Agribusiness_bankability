from django.db import models

from apps.assessments.models import Assessment
from apps.frameworks.models import Dimension, FrameworkVersion


class Recommendation(models.Model):
    framework_version = models.ForeignKey(
        FrameworkVersion, on_delete=models.CASCADE, related_name="recommendations"
    )
    dimension = models.ForeignKey(
        Dimension, on_delete=models.CASCADE, related_name="recommendations"
    )
    text = models.TextField()
    display_order = models.PositiveIntegerField()

    class Meta:
        ordering = ["dimension__display_order", "display_order"]

    def __str__(self):
        return self.text[:60]


class AssessmentRecommendation(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="recommendations"
    )
    recommendation = models.ForeignKey(
        Recommendation, on_delete=models.CASCADE, related_name="assessment_links"
    )
    priority_rank = models.PositiveIntegerField()

    class Meta:
        ordering = ["priority_rank"]
        unique_together = [("assessment", "recommendation")]

    def __str__(self):
        return f"#{self.priority_rank} {self.recommendation_id}"
