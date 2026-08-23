"""
Overall critical-gate status derivation per docs/11_CRITICAL_GATES.md:

    if all gates == PASS:       overall = "Ready"
    elif any gate == NOT_MET:   overall = "Not currently bankable"
    elif any gate == CAUTION:   overall = "Further preparation required"

A gate failure never auto-rejects or deletes an assessment -- this is
surfaced as a flag only, alongside the weighted ABI score.
"""

from apps.assessments.models import CriticalGateResult

STATUS_READY = "Ready"
STATUS_FURTHER_PREPARATION_REQUIRED = "Further preparation required"
STATUS_NOT_CURRENTLY_BANKABLE = "Not currently bankable"


def resolve_overall_gate_status(gate_results) -> str:
    results = [r.result for r in gate_results]
    if not results:
        raise ValueError("No gate results supplied.")
    if any(result == CriticalGateResult.Result.NOT_MET for result in results):
        return STATUS_NOT_CURRENTLY_BANKABLE
    if any(result == CriticalGateResult.Result.CAUTION for result in results):
        return STATUS_FURTHER_PREPARATION_REQUIRED
    return STATUS_READY
