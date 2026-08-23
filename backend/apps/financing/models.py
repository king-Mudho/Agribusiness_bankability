from django.contrib.postgres.fields import ArrayField
from django.db import models

from apps.assessments.models import Assessment
from apps.frameworks.models import FrameworkVersion


class FinancingPathwayDefinition(models.Model):
    framework_version = models.ForeignKey(
        FrameworkVersion, on_delete=models.CASCADE, related_name="financing_pathways"
    )
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=128)
    description = models.TextField()
    suited_bands = ArrayField(models.CharField(max_length=64), default=list)

    class Meta:
        unique_together = [("framework_version", "code")]
        ordering = ["name"]

    def __str__(self):
        return self.name


class AssessmentFinancingPathway(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="financing_pathways"
    )
    pathway = models.ForeignKey(
        FinancingPathwayDefinition, on_delete=models.CASCADE, related_name="assessment_links"
    )
    relevance_rank = models.PositiveIntegerField()

    class Meta:
        ordering = ["relevance_rank"]
        unique_together = [("assessment", "pathway")]

    def __str__(self):
        return f"#{self.relevance_rank} {self.pathway.code}"
