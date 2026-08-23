from rest_framework.permissions import BasePermission

INTERNAL_ROLES = {"ADMIN", "RESEARCHER", "DATA_COLLECTOR", "ANALYST", "VIEWER"}
RESEARCHER_ROLES = {"ADMIN", "RESEARCHER"}


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
