from django.contrib import admin

from apps.scoring.models import ABIScore, DimensionScore


@admin.register(DimensionScore)
class DimensionScoreAdmin(admin.ModelAdmin):
    list_display = ("assessment", "dimension", "raw_average", "weighted_contribution")


@admin.register(ABIScore)
class ABIScoreAdmin(admin.ModelAdmin):
    list_display = ("assessment", "total_score", "readiness_band_code", "computed_at")
