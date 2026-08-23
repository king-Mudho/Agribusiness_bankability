from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from .models import Enterprise
from .serializers import EnterpriseSerializer


class EnterpriseViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """GET/POST /enterprises/, GET/PATCH /enterprises/{id}/ per
    docs/06_API_ARCHITECTURE.md. Public respondent intake uses AllowAny;
    every read/write is already scoped to the enterprise's own id/link.
    """

    queryset = Enterprise.objects.select_related("profile").all()
    serializer_class = EnterpriseSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["value_chain", "province", "organisation_type"]
    http_method_names = ["get", "post", "patch", "head", "options"]
