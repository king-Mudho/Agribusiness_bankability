from django.contrib import admin

from apps.recommendations.models import AssessmentRecommendation, Recommendation


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ("dimension", "display_order", "text")
    list_filter = ("dimension",)


@admin.register(AssessmentRecommendation)
class AssessmentRecommendationAdmin(admin.ModelAdmin):
    list_display = ("assessment", "recommendation", "priority_rank")
