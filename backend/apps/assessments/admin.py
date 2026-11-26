from django.contrib import admin, messages
from django.http import HttpResponse
from django.utils import timezone

from apps.assessments.models import Assessment, AssessmentResponse, CriticalGateResult
from apps.audit.utils import log_action
from apps.reports.generators import generate_csv_export


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
    actions = ["export_csv"]

    def has_export_permission(self, request):
        """Bulk export exposes other enterprises' individual, named
        assessments, which the access matrix in docs/18_DATA_PRIVACY.md
        reserves for Admin. Staff accounts with any other role don't see the
        action at all.
        """
        user = request.user
        role = getattr(user, "role", None)
        return bool(user.is_active and role and role.name == "ADMIN")

    @admin.action(description="Export selected assessments to CSV", permissions=["export"])
    def export_csv(self, request, queryset):
        scored = list(
            queryset.filter(abi_score__isnull=False)
            .select_related("enterprise", "framework_version", "abi_score")
            .prefetch_related("responses", "dimension_scores", "gate_results")
            .order_by("submitted_at", "started_at")
        )
        skipped = queryset.count() - len(scored)

        if not scored:
            self.message_user(
                request, "None of the selected assessments has been scored yet.", messages.ERROR
            )
            return None

        versions = {a.framework_version for a in scored}
        if len(versions) > 1:
            self.message_user(
                request,
                "The selection spans more than one framework version, which have different "
                "CSV columns. Filter by framework version on the right, then export each one.",
                messages.ERROR,
            )
            return None

        version = versions.pop()
        content = generate_csv_export(scored)
        log_action(
            "assessments.exported",
            version,
            {
                "format": "CSV",
                "count": len(scored),
                "skipped_unscored": skipped,
                "assessment_ids": [str(a.pk) for a in scored],
            },
        )

        if skipped:
            # Shown on the next admin page load (the CSV download itself
            # can't carry a message).
            self.message_user(
                request,
                f"Exported {len(scored)} assessment(s); skipped {skipped} not yet scored.",
                messages.WARNING,
            )

        stamp = timezone.localtime().strftime("%Y%m%d-%H%M")
        filename = f"abi-assessments-v{version.version_label}-{stamp}.csv"
        response = HttpResponse(content, content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
