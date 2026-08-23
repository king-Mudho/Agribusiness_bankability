from django.contrib import admin

from apps.feedback.models import PilotFeedback


@admin.register(PilotFeedback)
class PilotFeedbackAdmin(admin.ModelAdmin):
    list_display = ("assessment", "score_reflects_enterprise", "would_recommend", "created_at")
