import uuid

from django.conf import settings
from django.db import models

from apps.enterprises.models import Enterprise
from apps.frameworks.models import CriticalGateDefinition, FrameworkVersion, Question


class Assessment(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        SCORED = "SCORED", "Scored"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enterprise = models.ForeignKey(
        Enterprise, on_delete=models.CASCADE, related_name="assessments"
    )
    framework_version = models.ForeignKey(
        FrameworkVersion, on_delete=models.PROTECT, related_name="assessments"
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    completion_seconds = models.PositiveIntegerField(null=True, blank=True)
    collected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="collected_assessments",
    )
    offline_created = models.BooleanField(default=False)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"Assessment {self.id} ({self.enterprise.name})"


class AssessmentResponse(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="responses"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="responses"
    )
    scale_value = models.PositiveSmallIntegerField()
    score_value = models.PositiveSmallIntegerField()

    class Meta:
        unique_together = [("assessment", "question")]

    def __str__(self):
        return f"{self.assessment_id} / {self.question.code} = {self.scale_value}"


class CriticalGateResult(models.Model):
    class Result(models.TextChoices):
        PASS = "PASS", "Pass"
        CAUTION = "CAUTION", "Caution"
        NOT_MET = "NOT_MET", "Not met"

    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="gate_results"
    )
    gate = models.ForeignKey(
        CriticalGateDefinition, on_delete=models.CASCADE, related_name="results"
    )
    result = models.CharField(max_length=16, choices=Result.choices)
    note = models.TextField(blank=True)

    class Meta:
        unique_together = [("assessment", "gate")]

    def __str__(self):
        return f"{self.gate.code}: {self.result}"
