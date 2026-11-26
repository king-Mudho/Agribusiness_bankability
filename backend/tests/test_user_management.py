"""User management from the frontend admin portal: create users, edit
roles/status, reset passwords (Admin only), and change your own password
(any signed-in user). Passwords must never be returned or audit-logged, and
the portal must not allow locking every Admin out.
"""

import json

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.audit.models import AuditLog

STRONG = "Harvest-Ledger-2026"


def _user(username, role_name=Role.ADMIN, password=STRONG, **extra):
    role, _ = Role.objects.get_or_create(name=role_name)
    return User.objects.create_user(username=username, password=password, role=role, **extra)


def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


@pytest.mark.django_db
def test_admin_creates_user_with_role(db):
    admin = _user("boss")
    resp = _client(admin).post(
        "/api/v1/admin/users/",
        {"username": "rita", "password": STRONG, "role": Role.RESEARCHER, "first_name": "Rita", "email": "r@example.org"},
        format="json",
    )
    assert resp.status_code == 201, resp.data
    assert "password" not in resp.data
    rita = User.objects.get(username="rita")
    assert rita.role.name == Role.RESEARCHER
    assert rita.check_password(STRONG)
    log = AuditLog.objects.get(action="user.created")
    assert STRONG not in json.dumps(log.metadata)


@pytest.mark.django_db
def test_create_rejects_duplicate_weak_password_and_bad_role(db):
    admin = _user("boss")
    c = _client(admin)
    dup = c.post("/api/v1/admin/users/", {"username": "BOSS", "password": STRONG, "role": Role.ADMIN}, format="json")
    assert dup.status_code == 400 and "username" in dup.data["error"]["field_errors"]
    weak = c.post("/api/v1/admin/users/", {"username": "new1", "password": "123", "role": Role.ADMIN}, format="json")
    assert weak.status_code == 400 and "password" in weak.data["error"]["field_errors"]
    role = c.post("/api/v1/admin/users/", {"username": "new2", "password": STRONG, "role": "KING"}, format="json")
    assert role.status_code == 400 and "role" in role.data["error"]["field_errors"]
    assert not User.objects.filter(username__in=["new1", "new2"]).exists()


@pytest.mark.django_db
@pytest.mark.parametrize("role_name", [Role.RESEARCHER, Role.ANALYST, Role.DATA_COLLECTOR, Role.VIEWER])
def test_non_admins_cannot_manage_users(db, role_name):
    target = _user("target", Role.ANALYST)
    c = _client(_user("someone", role_name))
    assert c.post("/api/v1/admin/users/", {"username": "x", "password": STRONG, "role": Role.ADMIN}, format="json").status_code == 403
    assert c.patch(f"/api/v1/admin/users/{target.pk}/", {"role": Role.ADMIN}, format="json").status_code == 403
    assert c.post(f"/api/v1/admin/users/{target.pk}/set-password/", {"password": STRONG}, format="json").status_code == 403
    assert c.get("/api/v1/admin/roles/").status_code == 403


@pytest.mark.django_db
def test_admin_edits_role_status_and_details(db):
    admin = _user("boss")
    _user("boss2")
    target = _user("ana", Role.ANALYST)
    resp = _client(admin).patch(
        f"/api/v1/admin/users/{target.pk}/",
        {"role": Role.RESEARCHER, "is_active": False, "last_name": "Moyo"},
        format="json",
    )
    assert resp.status_code == 200, resp.data
    target.refresh_from_db()
    assert (target.role.name, target.is_active, target.last_name) == (Role.RESEARCHER, False, "Moyo")
    assert AuditLog.objects.filter(action="user.updated", object_id=str(target.pk)).exists()


@pytest.mark.django_db
def test_admin_cannot_lock_themselves_out(db):
    admin = _user("boss")
    c = _client(admin)
    assert c.patch(f"/api/v1/admin/users/{admin.pk}/", {"is_active": False}, format="json").status_code == 400
    assert c.patch(f"/api/v1/admin/users/{admin.pk}/", {"role": Role.VIEWER}, format="json").status_code == 400
    admin.refresh_from_db()
    assert admin.is_active and admin.role.name == Role.ADMIN


@pytest.mark.django_db
def test_admin_can_demote_another_admin_while_one_remains(db):
    admin = _user("boss")
    other = _user("other_admin")
    resp = _client(admin).patch(f"/api/v1/admin/users/{other.pk}/", {"role": Role.VIEWER}, format="json")
    assert resp.status_code == 200
    assert User.objects.filter(is_active=True, role__name=Role.ADMIN).count() == 1


@pytest.mark.django_db
def test_admin_sets_password_for_user(db):
    admin = _user("boss")
    target = _user("forgetful", Role.ANALYST, password="Old-Password-991")
    c = _client(admin)
    assert c.post(f"/api/v1/admin/users/{target.pk}/set-password/", {"password": "short"}, format="json").status_code == 400
    resp = c.post(f"/api/v1/admin/users/{target.pk}/set-password/", {"password": STRONG}, format="json")
    assert resp.status_code == 200
    target.refresh_from_db()
    assert target.check_password(STRONG)
    log = AuditLog.objects.get(action="user.password_set")
    assert STRONG not in json.dumps(log.metadata)
    assert c.post("/api/v1/admin/users/99999/set-password/", {"password": STRONG}, format="json").status_code == 404


@pytest.mark.django_db
def test_change_own_password(db):
    me = _user("me", Role.ANALYST, password="Old-Password-991")
    c = _client(me)
    assert APIClient().post("/api/v1/auth/change-password/", {}, format="json").status_code == 401
    wrong = c.post("/api/v1/auth/change-password/", {"current_password": "nope", "new_password": STRONG}, format="json")
    assert wrong.status_code == 400 and "current_password" in wrong.data["error"]["field_errors"]
    weak = c.post("/api/v1/auth/change-password/", {"current_password": "Old-Password-991", "new_password": "1234"}, format="json")
    assert weak.status_code == 400 and "new_password" in weak.data["error"]["field_errors"]
    ok = c.post("/api/v1/auth/change-password/", {"current_password": "Old-Password-991", "new_password": STRONG}, format="json")
    assert ok.status_code == 200
    me.refresh_from_db()
    assert me.check_password(STRONG)
    assert AuditLog.objects.filter(action="user.password_changed", object_id=str(me.pk)).exists()


@pytest.mark.django_db
def test_user_list_never_exposes_passwords(db):
    admin = _user("boss")
    data = _client(admin).get("/api/v1/admin/users/").data
    assert all("password" not in row for row in data["results"])
    assert data["results"][0]["role"] == Role.ADMIN
