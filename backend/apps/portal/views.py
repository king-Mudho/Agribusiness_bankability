"""
Read-only API behind the frontend admin portal (/admin in the Next.js app),
so administrators never need the Django admin URL.

Access (docs/18_DATA_PRIVACY.md access matrix): every endpoint here exposes
other enterprises' individual, named records, so all of them require the
Admin role. Researchers and Analysts use the aggregate dashboard
(/research/dashboard/) and research tools instead. Bulk exports are recorded
in the AuditLog.
"""

import csv
import io
from datetime import datetime

from django.db.models import Count, Max, OuterRef, Q, Subquery
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions import IsAdminRole
from apps.accounts.models import User
from apps.assessments.models import Assessment
from apps.audit.models import AuditLog
from apps.audit.utils import log_action
from apps.enterprises.models import Enterprise
from apps.feedback.models import PilotFeedback
from apps.frameworks.models import FrameworkVersion, ReadinessBand
from apps.reports.excel import generate_table_xlsx
from apps.reports.generators import generate_csv_export
from apps.reports.models import Report
from apps.reports.views import XLSX_CONTENT_TYPE
from apps.research.models import CognitivePretestNote, ExpertReview
from config.disclaimers import RESEARCH_PROTOTYPE_DISCLAIMER


class PortalPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 200


class AdminView(APIView):
    permission_classes = [IsAdminRole]

    def paginate(self, request, queryset, serialize):
        paginator = PortalPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response([serialize(obj) for obj in page])


def _iso(dt):
    return dt.isoformat() if dt else None


def _band_labels():
    return {(b.framework_version_id, b.code): b.label for b in ReadinessBand.objects.all()}


def _filter_assessments(qs, params):
    q = params.get("q", "").strip()
    if q:
        qs = qs.filter(
            Q(enterprise__name__icontains=q)
            | Q(enterprise__code__icontains=q)
            | Q(enterprise__anonymous_respondent_code__icontains=q)
        )
    for param, field in (
        ("status", "status"),
        ("value_chain", "enterprise__value_chain"),
        ("province", "enterprise__province"),
        ("readiness_band", "abi_score__readiness_band_code"),
    ):
        value = params.get(param)
        if value:
            qs = qs.filter(**{field: value})
    date_from, date_to = params.get("date_from"), params.get("date_to")
    if date_from:
        qs = qs.filter(started_at__date__gte=datetime.fromisoformat(date_from).date())
    if date_to:
        qs = qs.filter(started_at__date__lte=datetime.fromisoformat(date_to).date())
    return qs


def _assessment_queryset():
    return Assessment.objects.select_related(
        "enterprise", "framework_version", "abi_score"
    ).order_by("-started_at")


def _serialize_assessment(a, band_labels):
    score = getattr(a, "abi_score", None)
    return {
        "id": str(a.id),
        "enterprise_id": str(a.enterprise_id),
        "enterprise_name": a.enterprise.name,
        "enterprise_code": a.enterprise.code,
        "respondent_code": a.enterprise.anonymous_respondent_code,
        "value_chain": a.enterprise.value_chain,
        "value_chain_label": a.enterprise.get_value_chain_display(),
        "province": a.enterprise.province,
        "province_label": a.enterprise.get_province_display(),
        "framework_version": a.framework_version.version_label,
        "status": a.status,
        "started_at": _iso(a.started_at),
        "submitted_at": _iso(a.submitted_at),
        "abi_score": float(score.total_score) if score else None,
        "readiness_band_code": score.readiness_band_code if score else None,
        "readiness_band_label": (
            band_labels.get((a.framework_version_id, score.readiness_band_code)) if score else None
        ),
        "evidence_coverage_percent": float(score.evidence_coverage_percent) if score else None,
        "report_count": getattr(a, "report_count", None),
    }


class OverviewView(AdminView):
    """GET /admin/overview/ -- headline counts and the latest activity."""

    def get(self, request):
        assessments = Assessment.objects.all()
        status_counts = dict(assessments.values_list("status").annotate(n=Count("id")))
        band_labels = _band_labels()
        recent = _assessment_queryset()[:8]
        report_counts = dict(Report.objects.values_list("report_type").annotate(n=Count("id")))
        feedback = PilotFeedback.objects.all()
        feedback_total = feedback.count()

        def share(field):
            answered = feedback.exclude(**{f"{field}__isnull": True}).count()
            yes = feedback.filter(**{field: True}).count()
            return round(yes / answered * 100, 1) if answered else None

        return Response(
            {
                "counts": {
                    "assessments": assessments.count(),
                    "scored": status_counts.get(Assessment.Status.SCORED, 0),
                    "submitted": status_counts.get(Assessment.Status.SUBMITTED, 0),
                    "drafts": status_counts.get(Assessment.Status.DRAFT, 0),
                    "enterprises": Enterprise.objects.count(),
                    "consented_enterprises": Enterprise.objects.filter(profile__consent_given=True).count(),
                    "reports": sum(report_counts.values()),
                    "feedback": feedback_total,
                    "expert_reviews": ExpertReview.objects.count(),
                    "pretest_notes": CognitivePretestNote.objects.count(),
                    "users": User.objects.filter(is_active=True).count(),
                },
                "reports_by_type": report_counts,
                "feedback_summary": {
                    "total": feedback_total,
                    "score_reflects_enterprise_percent": share("score_reflects_enterprise"),
                    "would_help_prepare_percent": share("would_help_prepare_for_finance"),
                    "would_recommend_percent": share("would_recommend"),
                    "willing_to_provide_evidence_percent": share("willing_to_provide_evidence_later"),
                },
                "recent_assessments": [_serialize_assessment(a, band_labels) for a in recent],
                "disclaimer": RESEARCH_PROTOTYPE_DISCLAIMER,
            }
        )


class AssessmentListView(AdminView):
    """GET /admin/assessments/?q=&status=&value_chain=&province=&readiness_band=&date_from=&date_to="""

    def get(self, request):
        qs = _filter_assessments(_assessment_queryset(), request.query_params).annotate(
            report_count=Count("reports")
        )
        band_labels = _band_labels()
        return self.paginate(request, qs, lambda a: _serialize_assessment(a, band_labels))


def _enterprise_queryset():
    latest = Assessment.objects.filter(enterprise=OuterRef("pk")).order_by("-started_at")
    return (
        Enterprise.objects.select_related("profile")
        .annotate(
            assessment_count=Count("assessments", distinct=True),
            last_assessed=Max("assessments__started_at"),
            latest_assessment_id=Subquery(latest.values("id")[:1]),
            latest_abi=Subquery(latest.values("abi_score__total_score")[:1]),
        )
        .order_by("-created_at")
    )


def _serialize_enterprise(e):
    profile = getattr(e, "profile", None)
    return {
        "id": str(e.id),
        "name": e.name,
        "code": e.code,
        "respondent_code": e.anonymous_respondent_code,
        "organisation_type": e.get_organisation_type_display(),
        "value_chain": e.get_value_chain_display(),
        "province": e.get_province_display(),
        "district": e.district,
        "years_operating": e.years_operating,
        "workers_count": e.workers_count,
        "turnover_band": e.get_turnover_band_display(),
        "finance_required_amount": float(profile.finance_required_amount) if profile else None,
        "finance_required_currency": profile.finance_required_currency if profile else None,
        "finance_type_sought": profile.get_finance_type_sought_display() if profile else None,
        "consent_given": profile.consent_given if profile else False,
        "consent_timestamp": _iso(profile.consent_timestamp) if profile else None,
        "assessment_count": e.assessment_count,
        "last_assessed": _iso(e.last_assessed),
        "latest_assessment_id": str(e.latest_assessment_id) if e.latest_assessment_id else None,
        "latest_abi": float(e.latest_abi) if e.latest_abi is not None else None,
        "created_at": _iso(e.created_at),
    }


class EnterpriseListView(AdminView):
    """GET /admin/enterprises/?q="""

    def get(self, request):
        qs = _enterprise_queryset()
        q = request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q) | Q(code__icontains=q) | Q(anonymous_respondent_code__icontains=q)
            )
        return self.paginate(request, qs, _serialize_enterprise)


class ReportListView(AdminView):
    """GET /admin/reports/?report_type=&q="""

    def get(self, request):
        qs = Report.objects.select_related("assessment__enterprise").order_by("-generated_at")
        report_type = request.query_params.get("report_type")
        if report_type:
            qs = qs.filter(report_type=report_type)
        q = request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(assessment__enterprise__name__icontains=q) | Q(assessment__enterprise__code__icontains=q)
            )
        return self.paginate(
            request,
            qs,
            lambda r: {
                "id": str(r.id),
                "assessment_id": str(r.assessment_id),
                "enterprise_name": r.assessment.enterprise.name,
                "enterprise_code": r.assessment.enterprise.code,
                "report_type": r.report_type,
                "report_type_label": r.get_report_type_display(),
                "generated_at": _iso(r.generated_at),
            },
        )


def _serialize_feedback(f):
    return {
        "id": f.id,
        "assessment_id": str(f.assessment_id),
        "enterprise_name": f.assessment.enterprise.name,
        "enterprise_code": f.assessment.enterprise.code,
        "score_reflects_enterprise": f.score_reflects_enterprise,
        "most_relevant_dimension": f.most_relevant_dimension.name if f.most_relevant_dimension else None,
        "unclear_question": f.unclear_question.code if f.unclear_question else None,
        "missing_factor_notes": f.missing_factor_notes,
        "would_help_prepare_for_finance": f.would_help_prepare_for_finance,
        "willing_to_provide_evidence_later": f.willing_to_provide_evidence_later,
        "perceived_duration_minutes": f.perceived_duration_minutes,
        "would_recommend": f.would_recommend,
        "created_at": _iso(f.created_at),
    }


def _feedback_queryset():
    return PilotFeedback.objects.select_related(
        "assessment__enterprise", "most_relevant_dimension", "unclear_question"
    ).order_by("-created_at")


class FeedbackListView(AdminView):
    """GET /admin/feedback/"""

    def get(self, request):
        return self.paginate(request, _feedback_queryset(), _serialize_feedback)


class ExpertReviewListView(AdminView):
    def get(self, request):
        qs = ExpertReview.objects.select_related("framework_version").order_by("-created_at")
        return self.paginate(
            request,
            qs,
            lambda r: {
                "id": r.id,
                "framework_version": r.framework_version.version_label,
                "reviewer_name": r.reviewer_name,
                "reviewer_affiliation": r.reviewer_affiliation,
                "comments": r.comments,
                "suggested_weight_changes": r.suggested_weight_changes,
                "created_at": _iso(r.created_at),
            },
        )


class PretestNoteListView(AdminView):
    def get(self, request):
        qs = CognitivePretestNote.objects.select_related("question", "assessment__enterprise").order_by(
            "-created_at"
        )
        return self.paginate(
            request,
            qs,
            lambda n: {
                "id": n.id,
                "assessment_id": str(n.assessment_id) if n.assessment_id else None,
                "enterprise_code": n.assessment.enterprise.code if n.assessment_id else None,
                "observer_name": n.observer_name,
                "question": n.question.code if n.question_id else None,
                "observation": n.observation,
                "perceived_usefulness_rating": n.perceived_usefulness_rating,
                "created_at": _iso(n.created_at),
            },
        )


class AuditLogListView(AdminView):
    """GET /admin/audit-log/?action="""

    def get(self, request):
        qs = AuditLog.objects.select_related("user").order_by("-created_at")
        action = request.query_params.get("action")
        if action:
            qs = qs.filter(action=action)
        return self.paginate(
            request,
            qs,
            lambda log: {
                "id": log.id,
                "user": log.user.username if log.user_id else None,
                "action": log.action,
                "object_type": log.object_type,
                "object_id": log.object_id,
                "metadata": log.metadata,
                "created_at": _iso(log.created_at),
            },
        )


# ------------------------------------------------------------------ exports

def _csv_text(headers, rows):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(rows)
    return buffer.getvalue()


def _assessment_export(params):
    scored = list(
        _filter_assessments(_assessment_queryset(), params)
        .filter(abi_score__isnull=False)
        .prefetch_related("responses", "dimension_scores", "gate_results")
        .order_by("submitted_at", "started_at")
    )
    if not scored:
        return None, "No scored assessments match these filters."
    versions = {a.framework_version_id for a in scored}
    if len(versions) > 1:
        requested = params.get("framework_version")
        if not requested:
            return None, "Matching assessments span several framework versions; add framework_version."
        scored = [a for a in scored if a.framework_version.version_label == requested]
        if not scored:
            return None, "No scored assessments for that framework version."
    rows = list(csv.reader(io.StringIO(generate_csv_export(scored))))
    return (rows[0], rows[1:], [str(a.pk) for a in scored]), None


def _enterprise_export(params):
    headers = [
        "name", "code", "respondent_code", "organisation_type", "value_chain", "province",
        "district", "years_operating", "workers_count", "turnover_band",
        "finance_required_amount", "finance_required_currency", "finance_type_sought",
        "consent_given", "consent_timestamp", "assessment_count", "last_assessed", "latest_abi",
        "disclaimer",
    ]
    rows = []
    for e in _enterprise_queryset():
        d = _serialize_enterprise(e)
        rows.append([d[h] for h in headers[:-1]] + [RESEARCH_PROTOTYPE_DISCLAIMER])
    return (headers, rows, None), None


def _feedback_export(params):
    headers = [
        "created_at", "assessment_id", "enterprise_name", "enterprise_code",
        "score_reflects_enterprise", "most_relevant_dimension", "unclear_question",
        "missing_factor_notes", "would_help_prepare_for_finance",
        "willing_to_provide_evidence_later", "perceived_duration_minutes", "would_recommend",
    ]
    rows = []
    for f in _feedback_queryset():
        d = _serialize_feedback(f)
        rows.append([d[h] for h in headers])
    return (headers, rows, None), None


EXPORTS = {
    "assessments": ("Assessments", _assessment_export),
    "enterprises": ("Enterprises", _enterprise_export),
    "feedback": ("Pilot feedback", _feedback_export),
}


class ExportView(AdminView):
    """GET /admin/export/<dataset>/?file_type=csv|xlsx (+ the same filters as
    the list endpoint). `file_type` rather than `format`, because DRF reserves
    `?format=` for content negotiation."""

    def get(self, request, dataset):
        if dataset not in EXPORTS:
            return Response(
                {"error": {"code": "unknown_dataset", "message": "Unknown export.", "field_errors": {}}},
                status=404,
            )
        file_type = request.query_params.get("file_type", "csv").lower()
        if file_type not in ("csv", "xlsx"):
            return Response(
                {"error": {"code": "invalid_file_type", "message": "file_type must be csv or xlsx.", "field_errors": {}}},
                status=400,
            )

        title, builder = EXPORTS[dataset]
        result, error = builder(request.query_params)
        if error:
            return Response({"error": {"code": "nothing_to_export", "message": error, "field_errors": {}}}, status=400)
        headers, rows, ids = result

        log_action(
            f"{dataset}.exported",
            request.user,
            {"format": file_type.upper(), "count": len(rows), "via": "admin_portal", **({"assessment_ids": ids} if ids else {})},
        )

        stamp = timezone.localtime().strftime("%Y%m%d-%H%M")
        if file_type == "xlsx":
            response = HttpResponse(generate_table_xlsx(title, headers, rows), content_type=XLSX_CONTENT_TYPE)
        else:
            response = HttpResponse(_csv_text(headers, rows), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="abi-{dataset}-{stamp}.{file_type}"'
        return response


class FrameworkVersionsView(AdminView):
    """GET /admin/frameworks/ -- versions with their status, for the export filter."""

    def get(self, request):
        return Response(
            [
                {"version_label": fv.version_label, "status": fv.status}
                for fv in FrameworkVersion.objects.order_by("-effective_from")
            ]
        )
