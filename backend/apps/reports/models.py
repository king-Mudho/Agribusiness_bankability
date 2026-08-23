import uuid

from django.db import models

from apps.assessments.models import Assessment


class Report(models.Model):
    class ReportType(models.TextChoices):
        PDF = "PDF", "PDF"
        CSV = "CSV", "CSV"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="reports"
    )
    report_type = models.CharField(max_length=8, choices=ReportType.choices)
    file = models.FileField(upload_to="reports/")
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.report_type} report for {self.assessment_id}"
