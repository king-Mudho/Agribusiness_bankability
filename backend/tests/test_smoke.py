import pytest

from apps.accounts.models import Role


@pytest.mark.django_db
def test_role_can_be_created():
    role = Role.objects.create(name=Role.ADMIN)
    assert role.pk is not None
    assert str(role) == "ADMIN"
