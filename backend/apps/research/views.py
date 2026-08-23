from rest_framework.generics import CreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response

from api.permissions import CanViewAggregateDashboard, IsResearcherOrAdmin

from .dashboard import build_dashboard_payload
from .serializers import CognitivePretestNoteSerializer, ExpertReviewSerializer


class ResearchDashboardView(APIView):
    """GET /api/v1/research/dashboard/ -- internal auth required. Never
    includes Enterprise.name or unbanded financial figures.
    """

    permission_classes = [CanViewAggregateDashboard]

    def get(self, request):
        payload = build_dashboard_payload(request.query_params)
        payload["caption"] = (
            "This dashboard reflects pilot data collected during the research "
            "demonstration. It is not a national benchmark."
        )
        return Response(payload)


class ExpertReviewCreateView(CreateAPIView):
    serializer_class = ExpertReviewSerializer
    permission_classes = [IsResearcherOrAdmin]


class CognitivePretestNoteCreateView(CreateAPIView):
    serializer_class = CognitivePretestNoteSerializer
    permission_classes = [IsResearcherOrAdmin]
