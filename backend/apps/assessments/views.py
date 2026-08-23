from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.feedback.models import PilotFeedback
from apps.feedback.serializers import PilotFeedbackSerializer
from apps.scoring.exceptions import IncompleteAssessmentError

from . import services
from .models import Assessment
from .results import build_results_payload
from .serializers import (
    AssessmentCreateSerializer,
    AssessmentSerializer,
    EvidenceUpsertItemSerializer,
    GateUpsertItemSerializer,
    ResponseUpsertItemSerializer,
)


def _error(code: str, message: str, field_errors: dict | None = None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"error": {"code": code, "message": message, "field_errors": field_errors or {}}},
        status=http_status,
    )


class AssessmentViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """POST /assessments/, GET /assessments/{id}/ plus the sub-resource
    actions from docs/06_API_ARCHITECTURE.md. Public (AllowAny): every
    read/write is scoped to the specific assessment id in the URL, never a
    list of all assessments.
    """

    queryset = Assessment.objects.select_related("enterprise", "framework_version").all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "create":
            return AssessmentCreateSerializer
        return AssessmentSerializer

    @action(detail=True, methods=["put"])
    def responses(self, request, pk=None):
        assessment = self.get_object()
        serializer = ResponseUpsertItemSerializer(data=request.data.get("responses", []), many=True)
        serializer.is_valid(raise_exception=True)
        try:
            saved = services.upsert_responses(assessment, serializer.validated_data)
        except services.UnknownCodeError as exc:
            return _error("unknown_question_code", str(exc), {"codes": exc.codes})
        return Response({"saved": len(saved)})

    @action(detail=True, methods=["put"])
    def gates(self, request, pk=None):
        assessment = self.get_object()
        serializer = GateUpsertItemSerializer(data=request.data.get("gates", []), many=True)
        serializer.is_valid(raise_exception=True)
        try:
            saved = services.upsert_gates(assessment, serializer.validated_data)
        except services.UnknownCodeError as exc:
            return _error("unknown_gate_code", str(exc), {"codes": exc.codes})
        return Response({"saved": len(saved)})

    @action(detail=True, methods=["put"])
    def evidence(self, request, pk=None):
        assessment = self.get_object()
        serializer = EvidenceUpsertItemSerializer(data=request.data.get("evidence", []), many=True)
        serializer.is_valid(raise_exception=True)
        try:
            saved = services.upsert_evidence(assessment, serializer.validated_data)
        except services.UnknownCodeError as exc:
            return _error("unknown_evidence_target", str(exc), {"codes": exc.codes})
        return Response({"saved": len(saved)})

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        assessment = self.get_object()
        try:
            services.submit_assessment(assessment)
        except IncompleteAssessmentError as exc:
            return _error(
                "incomplete_assessment",
                "All 24 questions must be answered before submitting.",
                {"missing_question_codes": exc.missing_question_codes},
            )
        return Response(build_results_payload(assessment))

    @action(detail=True, methods=["get"])
    def score(self, request, pk=None):
        assessment = self.get_object()
        if not hasattr(assessment, "abi_score"):
            return _error(
                "not_scored", "This assessment has not been scored yet.", http_status=status.HTTP_409_CONFLICT
            )
        abi_score = assessment.abi_score
        return Response(
            {
                "abi_score": float(abi_score.total_score),
                "readiness_band_code": abi_score.readiness_band_code,
                "evidence_coverage_percent": float(abi_score.evidence_coverage_percent),
                "dimension_scores": [
                    {
                        "dimension": ds.dimension.name,
                        "dimension_code": ds.dimension.code,
                        "score": float(ds.raw_average),
                        "weight_percent": float(ds.dimension.weight_percent),
                    }
                    for ds in assessment.dimension_scores.select_related("dimension").order_by(
                        "dimension__display_order"
                    )
                ],
            }
        )

    @action(detail=True, methods=["get"])
    def results(self, request, pk=None):
        assessment = self.get_object()
        if not hasattr(assessment, "abi_score"):
            return _error(
                "not_scored", "This assessment has not been scored yet.", http_status=status.HTTP_409_CONFLICT
            )
        return Response(build_results_payload(assessment))

    @action(detail=True, methods=["get"])
    def recommendations(self, request, pk=None):
        assessment = self.get_object()
        rows = assessment.recommendations.select_related("recommendation__dimension").order_by(
            "priority_rank"
        )
        return Response(
            [
                {
                    "dimension": row.recommendation.dimension.name,
                    "text": row.recommendation.text,
                    "priority_rank": row.priority_rank,
                }
                for row in rows
            ]
        )

    @action(detail=True, methods=["get"])
    def financing(self, request, pk=None):
        assessment = self.get_object()
        rows = assessment.financing_pathways.select_related("pathway").order_by("relevance_rank")
        return Response(
            [
                {
                    "code": row.pathway.code,
                    "name": row.pathway.name,
                    "description": row.pathway.description,
                    "relevance_rank": row.relevance_rank,
                }
                for row in rows
            ]
        )

    @action(detail=True, methods=["post"])
    def feedback(self, request, pk=None):
        assessment = self.get_object()
        serializer = PilotFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(assessment=assessment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="load-demo")
    def load_demo(self, request):
        enterprise_code = request.data.get("enterprise_code")
        if not enterprise_code:
            return _error("missing_enterprise_code", "enterprise_code is required.")
        try:
            assessment = services.create_demo_assessment(enterprise_code)
        except Assessment.DoesNotExist:
            return _error(
                "unknown_demo_enterprise",
                f"No demo enterprise with code {enterprise_code}.",
                http_status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"assessment_id": str(assessment.id)}, status=status.HTTP_201_CREATED)
