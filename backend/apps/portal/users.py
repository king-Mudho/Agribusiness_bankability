"""
User management for the frontend admin portal (Admin role only): list,
create, edit role/details/active status, and set a new password for someone.
Plus "change my own password" for any signed-in staff member.

Rules:
- Passwords are checked with Django's AUTH_PASSWORD_VALIDATORS and stored
  hashed. They are never returned, logged or written to the AuditLog.
- An admin cannot deactivate their own account or remove their own Admin
  role, and the last active Admin can't be demoted or deactivated, so the
  portal can never lock everyone out.
- Every change is recorded in the AuditLog (without the password).
"""

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Role, User
from apps.audit.utils import log_action

from .views import AdminView


def _iso(dt):
    return dt.isoformat() if dt else None


def serialize_user(u):
    return {
        "id": u.id,
        "username": u.username,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "full_name": u.get_full_name(),
        "email": u.email,
        "role": u.role.name if u.role_id else None,
        "role_label": u.role.get_name_display() if u.role_id else None,
        "is_active": u.is_active,
        "last_login": _iso(u.last_login),
        "date_joined": _iso(u.date_joined),
    }


def _error(message, field_errors=None, status=400, code="invalid"):
    return Response(
        {"error": {"code": code, "message": message, "field_errors": field_errors or {}}},
        status=status,
    )


def _password_errors(password, user=None):
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        return list(exc.messages)
    return []


def _active_admin_count(exclude_pk=None):
    qs = User.objects.filter(is_active=True, role__name=Role.ADMIN)
    if exclude_pk is not None:
        qs = qs.exclude(pk=exclude_pk)
    return qs.count()


def _role_from(value):
    valid = {code for code, _ in Role.NAME_CHOICES}
    if value not in valid:
        return None
    role, _ = Role.objects.get_or_create(name=value)
    return role


class RoleListView(AdminView):
    """GET /admin/roles/ -- the role choices for the user form."""

    def get(self, request):
        return Response([{"value": code, "label": label} for code, label in Role.NAME_CHOICES])


class UserListCreateView(AdminView):
    """GET /admin/users/ -- list.  POST /admin/users/ -- create.

    POST body: username, password, role, and optionally first_name,
    last_name, email, is_active (default true).
    """

    def get(self, request):
        qs = User.objects.select_related("role").order_by("username")
        return self.paginate(request, qs, serialize_user)

    def post(self, request):
        data = request.data
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""
        field_errors = {}

        if not username:
            field_errors["username"] = ["Username is required."]
        elif User.objects.filter(username__iexact=username).exists():
            field_errors["username"] = ["That username is already taken."]
        role = _role_from(data.get("role"))
        if role is None:
            field_errors["role"] = ["Choose a valid role."]

        candidate = User(
            username=username,
            first_name=(data.get("first_name") or "").strip(),
            last_name=(data.get("last_name") or "").strip(),
            email=(data.get("email") or "").strip(),
        )
        if not password:
            field_errors["password"] = ["Password is required."]
        else:
            problems = _password_errors(password, candidate)
            if problems:
                field_errors["password"] = problems

        if field_errors:
            return _error("Please fix the highlighted fields.", field_errors)

        candidate.role = role
        candidate.is_active = bool(data.get("is_active", True))
        candidate.set_password(password)
        candidate.save()
        log_action("user.created", candidate, {"username": candidate.username, "role": role.name})
        return Response(serialize_user(candidate), status=201)


class UserDetailView(AdminView):
    """PATCH /admin/users/{id}/ -- change first_name, last_name, email, role,
    is_active. Usernames and passwords are not changed here."""

    def patch(self, request, pk):
        user = User.objects.select_related("role").filter(pk=pk).first()
        if user is None:
            return _error("No such user.", status=404, code="not_found")
        data = request.data
        changes = {}

        with transaction.atomic():
            for field in ("first_name", "last_name", "email"):
                if field in data:
                    value = (data.get(field) or "").strip()
                    if value != getattr(user, field):
                        setattr(user, field, value)
                        changes[field] = value

            if "role" in data:
                role = _role_from(data.get("role"))
                if role is None:
                    return _error("Choose a valid role.", {"role": ["Choose a valid role."]})
                if user.role_id != role.id:
                    losing_admin = user.role_id and user.role.name == Role.ADMIN and role.name != Role.ADMIN
                    if losing_admin and user.pk == request.user.pk:
                        return _error("You can't remove your own Admin role.", {"role": ["You can't remove your own Admin role."]})
                    if losing_admin and user.is_active and _active_admin_count(exclude_pk=user.pk) == 0:
                        return _error("There must be at least one active Admin.", {"role": ["This is the last active Admin."]})
                    user.role = role
                    changes["role"] = role.name

            if "is_active" in data:
                is_active = bool(data.get("is_active"))
                if is_active != user.is_active:
                    if not is_active and user.pk == request.user.pk:
                        return _error("You can't deactivate your own account.", {"is_active": ["You can't deactivate your own account."]})
                    is_admin = user.role_id and user.role.name == Role.ADMIN
                    if not is_active and is_admin and _active_admin_count(exclude_pk=user.pk) == 0:
                        return _error("There must be at least one active Admin.", {"is_active": ["This is the last active Admin."]})
                    user.is_active = is_active
                    changes["is_active"] = is_active

            if changes:
                user.save()
                log_action("user.updated", user, {"username": user.username, "changes": changes})

        return Response(serialize_user(user))


class UserSetPasswordView(AdminView):
    """POST /admin/users/{id}/set-password/ {"password": "..."} -- an admin
    sets a new password for someone (e.g. they forgot theirs)."""

    def post(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if user is None:
            return _error("No such user.", status=404, code="not_found")
        password = request.data.get("password") or ""
        problems = _password_errors(password, user) if password else ["Password is required."]
        if problems:
            return _error("That password can't be used.", {"password": problems})
        user.set_password(password)
        user.save(update_fields=["password"])
        log_action("user.password_set", user, {"username": user.username, "by_admin": True})
        return Response({"detail": "Password updated."})


class ChangeOwnPasswordView(APIView):
    """POST /auth/change-password/ {"current_password", "new_password"} --
    any signed-in staff member changes their own password."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current = request.data.get("current_password") or ""
        new = request.data.get("new_password") or ""
        if not user.check_password(current):
            return _error("Your current password is incorrect.", {"current_password": ["Incorrect password."]})
        if not new:
            return _error("Enter a new password.", {"new_password": ["Password is required."]})
        if new == current:
            return _error("Choose a password different from the current one.", {"new_password": ["Same as the current password."]})
        problems = _password_errors(new, user)
        if problems:
            return _error("That password can't be used.", {"new_password": problems})
        user.set_password(new)
        user.save(update_fields=["password"])
        log_action("user.password_changed", user, {"username": user.username})
        return Response({"detail": "Password changed."})
