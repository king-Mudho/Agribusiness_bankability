from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FrameworkVersion
from .serializers import (
    CriticalGateDefinitionSerializer,
    DimensionDefinitionSerializer,
    FrameworkVersionListSerializer,
    ReadinessBandSerializer,
)


class FrameworkVersionListView(ListAPIView):
    """GET /api/v1/frameworks/ -- list framework versions."""

    queryset = FrameworkVersion.objects.all()
    serializer_class = FrameworkVersionListSerializer
    permission_classes = [AllowAny]


class FrameworkDefinitionView(APIView):
    """GET /api/v1/frameworks/{version}/ -- full definition used to render
    the wizard: dimensions -> questions -> options, critical gates and
    readiness bands. The frontend renders this; it never hardcodes it.
    """

    permission_classes = [AllowAny]

    def get(self, request, version_label):
        framework_version = get_object_or_404(FrameworkVersion, version_label=version_label)
        shared_options = list(
            framework_version.shared_response_options.all().order_by("scale_value")
        )
        context = {"shared_options": shared_options}
        dimensions = framework_version.dimensions.all().order_by("display_order")
        critical_gates = framework_version.critical_gates.all().order_by("display_order")
        readiness_bands = framework_version.readiness_bands.all().order_by("-min_score")

        return Response(
            {
                "version_label": framework_version.version_label,
                "dimensions": DimensionDefinitionSerializer(
                    dimensions, many=True, context=context
                ).data,
                "critical_gates": CriticalGateDefinitionSerializer(
                    critical_gates, many=True
                ).data,
                "readiness_bands": ReadinessBandSerializer(readiness_bands, many=True).data,
            }
        )
