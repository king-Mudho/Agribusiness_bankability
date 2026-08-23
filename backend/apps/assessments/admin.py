from django.contrib import admin

from apps.assessments.models import Assessment, AssessmentResponse, CriticalGateResult


class AssessmentResponseInline(admin.TabularInline):
    model = AssessmentResponse
    extra = 0


class CriticalGateResultInline(admin.TabularInline):
    model = CriticalGateResult
    extra = 0


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("id", "enterprise", "framework_version", "status", "started_at")
    list_filter = ("status", "framework_version")
    inlines = [AssessmentResponseInline, CriticalGateResultInline]
