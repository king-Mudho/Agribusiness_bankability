from django.contrib import admin

from apps.research.models import CognitivePretestNote, ExpertReview


@admin.register(ExpertReview)
class ExpertReviewAdmin(admin.ModelAdmin):
    list_display = ("reviewer_name", "framework_version", "created_at")


@admin.register(CognitivePretestNote)
class CognitivePretestNoteAdmin(admin.ModelAdmin):
    list_display = ("observer_name", "question", "assessment", "created_at")
