from django.db import models

from apps.assessments.models import Assessment
from apps.frameworks.models import FrameworkVersion, Question


class ExpertReview(models.Model):
    framework_version = models.ForeignKey(
        FrameworkVersion, on_delete=models.CASCADE, related_name="expert_reviews"
    )
    reviewer_name = models.CharField(max_length=128)
    reviewer_affiliation = models.CharField(max_length=255, blank=True)
    comments = models.TextField()
    suggested_weight_changes = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review by {self.reviewer_name}"


class CognitivePretestNote(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="pretest_notes",
        null=True,
        blank=True,
    )
    observer_name = models.CharField(max_length=128)
    question = models.ForeignKey(
        Question, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    observation = models.TextField()
    perceived_usefulness_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pretest note by {self.observer_name}"
