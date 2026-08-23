from django.db import models

from apps.assessments.models import Assessment
from apps.frameworks.models import Dimension


class DimensionScore(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="dimension_scores"
    )
    dimension = models.ForeignKey(
        Dimension, on_delete=models.CASCADE, related_name="scores"
    )
    raw_average = models.DecimalField(max_digits=6, decimal_places=2)
    weighted_contribution = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        unique_together = [("assessment", "dimension")]
        ordering = ["dimension__display_order"]

    def __str__(self):
        return f"{self.dimension.code}: {self.raw_average}"


class ABIScore(models.Model):
    assessment = models.OneToOneField(
        Assessment, on_delete=models.CASCADE, related_name="abi_score"
    )
    total_score = models.DecimalField(max_digits=5, decimal_places=2)
    readiness_band_code = models.CharField(max_length=64)
    evidence_coverage_percent = models.DecimalField(max_digits=5, decimal_places=2)
    computed_at = models.DateTimeField(auto_now=True)
    scoring_engine_version = models.CharField(max_length=16, default="1.0")

    def __str__(self):
        return f"ABI {self.total_score} ({self.readiness_band_code})"
