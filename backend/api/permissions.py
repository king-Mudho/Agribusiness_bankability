from rest_framework.permissions import BasePermission

INTERNAL_ROLES = {"ADMIN", "RESEARCHER", "DATA_COLLECTOR", "ANALYST", "VIEWER"}
RESEARCHER_ROLES = {"ADMIN", "RESEARCHER"}
DASHBOARD_ROLES = {"ADMIN", "RESEARCHER", "ANALYST"}


class IsInternalUser(BasePermission):
    """Any authenticated user holding an internal Role."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        role = getattr(user, "role", None)
        return bool(role and role.name in INTERNAL_ROLES)


class IsResearcherOrAdmin(BasePermission):
    """Required for /research/* write endpoints and framework version management."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        role = getattr(user, "role", None)
        return bool(role and role.name in RESEARCHER_ROLES)


class IsAdminRole(BasePermission):
    """Access matrix (docs/18_DATA_PRIVACY.md): only Admin may view other
    individual enterprises'/assessments' data in bulk (e.g. listing every
    enterprise). Everyone else only ever reads their own record by id/link.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        role = getattr(user, "role", None)
        return bool(role and role.name == "ADMIN")


class CanViewAggregateDashboard(BasePermission):
    """Access matrix (docs/18_DATA_PRIVACY.md): Analyst, Researcher and Admin
    can view the aggregate dashboard; Data Collector and Viewer cannot.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        role = getattr(user, "role", None)
        return bool(role and role.name in DASHBOARD_ROLES)
