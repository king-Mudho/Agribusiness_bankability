from django.db import models

from apps.assessments.models import Assessment
from apps.frameworks.models import Dimension, Question


class PilotFeedback(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="feedback_entries"
    )
    score_reflects_enterprise = models.BooleanField(null=True, blank=True)
    most_relevant_dimension = models.ForeignKey(
        Dimension, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    unclear_question = models.ForeignKey(
        Question, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    missing_factor_notes = models.TextField(blank=True)
    would_help_prepare_for_finance = models.BooleanField(null=True, blank=True)
    willing_to_provide_evidence_later = models.BooleanField(null=True, blank=True)
    perceived_duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    would_recommend = models.BooleanField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.assessment_id}"
