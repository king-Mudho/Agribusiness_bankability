from types import SimpleNamespace

import pytest

from apps.assessments.gates import (
    STATUS_FURTHER_PREPARATION_REQUIRED,
    STATUS_NOT_CURRENTLY_BANKABLE,
    STATUS_READY,
    resolve_overall_gate_status,
)
from apps.assessments.models import CriticalGateResult


def _results(*values):
    return [SimpleNamespace(result=v) for v in values]


def test_all_pass_is_ready():
    results = _results(*([CriticalGateResult.Result.PASS] * 5))
    assert resolve_overall_gate_status(results) == STATUS_READY


def test_any_not_met_is_not_currently_bankable():
    results = _results(
        CriticalGateResult.Result.PASS,
        CriticalGateResult.Result.CAUTION,
        CriticalGateResult.Result.NOT_MET,
        CriticalGateResult.Result.PASS,
        CriticalGateResult.Result.PASS,
    )
    assert resolve_overall_gate_status(results) == STATUS_NOT_CURRENTLY_BANKABLE


def test_any_caution_without_not_met_is_further_preparation_required():
    results = _results(
        CriticalGateResult.Result.PASS,
        CriticalGateResult.Result.PASS,
        CriticalGateResult.Result.CAUTION,
        CriticalGateResult.Result.PASS,
        CriticalGateResult.Result.PASS,
    )
    assert resolve_overall_gate_status(results) == STATUS_FURTHER_PREPARATION_REQUIRED


def test_empty_results_raises():
    with pytest.raises(ValueError):
        resolve_overall_gate_status([])


@pytest.mark.django_db
def test_maundurahuku_seed_is_further_preparation_required(seeded_db):
    from apps.assessments.models import Assessment

    assessment = Assessment.objects.get(enterprise__code="DEMO-MAUNDURAHUKU")
    status = resolve_overall_gate_status(assessment.gate_results.all())
    assert status == STATUS_FURTHER_PREPARATION_REQUIRED


@pytest.mark.django_db
def test_zvemuchando_seed_is_ready(seeded_db):
    from apps.assessments.models import Assessment

    assessment = Assessment.objects.get(enterprise__code="DEMO-ZVEMUCHANDO")
    status = resolve_overall_gate_status(assessment.gate_results.all())
    assert status == STATUS_READY
