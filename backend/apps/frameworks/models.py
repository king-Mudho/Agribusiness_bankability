from django.core.exceptions import ValidationError
from django.db import models


class FrameworkVersion(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        ARCHIVED = "ARCHIVED", "Archived"

    version_label = models.CharField(max_length=16, unique=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    effective_from = models.DateTimeField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-effective_from"]

    def __str__(self):
        return f"FrameworkVersion {self.version_label}"

    def dimensions_weight_sum(self):
        from django.db.models import Sum

        return self.dimensions.aggregate(total=Sum("weight_percent"))["total"] or 0

    def clean(self):
        if self.pk and self.dimensions.exists():
            total = self.dimensions_weight_sum()
            if total != 100:
                raise ValidationError(
                    f"Dimension weight_percent values must sum to 100, got {total}."
                )


class Dimension(models.Model):
    framework_version = models.ForeignKey(
        FrameworkVersion, on_delete=models.CASCADE, related_name="dimensions"
    )
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=128)
    weight_percent = models.DecimalField(max_digits=5, decimal_places=2)
    display_order = models.PositiveIntegerField()

    class Meta:
        ordering = ["display_order"]
        unique_together = [("framework_version", "code")]

    def __str__(self):
        return f"{self.name} ({self.weight_percent}%)"


class Question(models.Model):
    dimension = models.ForeignKey(
        Dimension, on_delete=models.CASCADE, related_name="questions"
    )
    code = models.CharField(max_length=64)
    prompt = models.TextField()
    display_order = models.PositiveIntegerField()

    class Meta:
        ordering = ["display_order"]
        unique_together = [("dimension", "code")]

    def __str__(self):
        return self.code


class ResponseOption(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="options",
        null=True,
        blank=True,
    )
    framework_version = models.ForeignKey(
        FrameworkVersion,
        on_delete=models.CASCADE,
        related_name="shared_response_options",
        null=True,
        blank=True,
    )
    scale_value = models.PositiveSmallIntegerField()
    label = models.CharField(max_length=128)
    score_value = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["scale_value"]

    def __str__(self):
        return f"{self.scale_value} -> {self.label} ({self.score_value})"


class CriticalGateDefinition(models.Model):
    framework_version = models.ForeignKey(
        FrameworkVersion, on_delete=models.CASCADE, related_name="critical_gates"
    )
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=128)
    description = models.TextField()
    display_order = models.PositiveIntegerField()

    class Meta:
        ordering = ["display_order"]
        unique_together = [("framework_version", "code")]

    def __str__(self):
        return self.name


class ReadinessBand(models.Model):
    framework_version = models.ForeignKey(
        FrameworkVersion, on_delete=models.CASCADE, related_name="readiness_bands"
    )
    code = models.CharField(max_length=64)
    label = models.CharField(max_length=128)
    min_score = models.PositiveSmallIntegerField()
    max_score = models.PositiveSmallIntegerField()
    display_order = models.PositiveIntegerField()

    class Meta:
        ordering = ["-min_score"]
        unique_together = [("framework_version", "code")]

    def __str__(self):
        return f"{self.label} ({self.min_score}-{self.max_score})"
