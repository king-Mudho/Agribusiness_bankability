from django.contrib import admin

from apps.reports.models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "assessment", "report_type", "generated_at")
