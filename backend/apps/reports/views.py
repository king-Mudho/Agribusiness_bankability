from django.core.files.base import ContentFile
from django.http import FileResponse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.assessments.models import Assessment
from apps.audit.utils import log_action

from .generators import generate_csv_report, generate_pdf_report
from .models import Report
from .serializers import ReportSerializer

CONTENT_TYPES = {Report.ReportType.PDF: "application/pdf", Report.ReportType.CSV: "text/csv"}


class ReportViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """GET/POST /reports/, GET /reports/{id}/download/ per
    docs/06_API_ARCHITECTURE.md. List is only ever scoped to one assessment
    (?assessment=<id>) -- never returns another assessment's reports to an
    anonymous caller, per docs/16_REPORTING_SPECIFICATION.md § Access control.
    """

    queryset = Report.objects.select_related("assessment").all()
    serializer_class = ReportSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            qs = qs.filter(assessment_id=assessment_id)
        return qs

    def list(self, request, *args, **kwargs):
        if not request.query_params.get("assessment"):
            return Response(
                {
                    "error": {
                        "code": "assessment_required",
                        "message": "?assessment=<id> is required to list reports.",
                        "field_errors": {},
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        assessment_id = request.data.get("assessment")
        report_type = request.data.get("report_type")
        assessment = Assessment.objects.filter(pk=assessment_id).select_related(
            "enterprise", "framework_version"
        ).first()
        if assessment is None:
            return Response(
                {
                    "error": {
                        "code": "unknown_assessment",
                        "message": "No assessment with that id.",
                        "field_errors": {},
                    }
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        if not hasattr(assessment, "abi_score"):
            return Response(
                {
                    "error": {
                        "code": "not_scored",
                        "message": "This assessment has not been scored yet.",
                        "field_errors": {},
                    }
                },
                status=status.HTTP_409_CONFLICT,
            )

        report = Report.objects.create(assessment=assessment, report_type=report_type)
        if report_type == Report.ReportType.PDF:
            content = generate_pdf_report(assessment)
            report.file.save(f"{report.id}.pdf", ContentFile(content), save=True)
        elif report_type == Report.ReportType.CSV:
            content = generate_csv_report(assessment)
            report.file.save(f"{report.id}.csv", ContentFile(content.encode("utf-8")), save=True)
        else:
            report.delete()
            return Response(
                {
                    "error": {
                        "code": "invalid_report_type",
                        "message": "report_type must be PDF or CSV.",
                        "field_errors": {},
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        log_action("report.generated", report, {"report_type": report_type})
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        report = self.get_object()
        content_type = CONTENT_TYPES[report.report_type]
        return FileResponse(
            report.file.open("rb"), content_type=content_type, filename=report.file.name.split("/")[-1]
        )
