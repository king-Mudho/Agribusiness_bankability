from django.contrib import admin

from apps.evidence.models import EvidenceRecord


@admin.register(EvidenceRecord)
class EvidenceRecordAdmin(admin.ModelAdmin):
    list_display = ("assessment", "question", "dimension", "evidence_level")
