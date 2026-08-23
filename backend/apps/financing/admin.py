from django.contrib import admin

from apps.financing.models import AssessmentFinancingPathway, FinancingPathwayDefinition


@admin.register(FinancingPathwayDefinition)
class FinancingPathwayDefinitionAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "framework_version", "suited_bands")


@admin.register(AssessmentFinancingPathway)
class AssessmentFinancingPathwayAdmin(admin.ModelAdmin):
    list_display = ("assessment", "pathway", "relevance_rank")
