from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from api.permissions import IsAdminRole
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
    docs/06_API_ARCHITECTURE.md. Create/retrieve/update are AllowAny because
    a public respondent's own read/write is already scoped to their own
    enterprise id/link. `list` is the one action that would otherwise hand
    every visitor every other enterprise's name and exact finance figures
    (docs/18_DATA_PRIVACY.md: public respondents may see their own data only,
    never another enterprise's), so it's restricted to Admin.
    """

    queryset = Enterprise.objects.select_related("profile").all()
    serializer_class = EnterpriseSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["value_chain", "province", "organisation_type"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        if self.action == "list":
            return [IsAdminRole()]
        return super().get_permissions()
