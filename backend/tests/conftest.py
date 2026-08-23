import pytest
from django.core.management import call_command


@pytest.fixture
def seeded_db(db):
    """Runs the real seed_abi_v01 command so tests exercise the actual
    FrameworkVersion 0.1 data and the two demo enterprises, not a synthetic
    stand-in framework.
    """
    call_command("seed_abi_v01")
    return None
