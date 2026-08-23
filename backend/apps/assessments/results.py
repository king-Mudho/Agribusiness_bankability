from config.disclaimers import RESEARCH_PROTOTYPE_DISCLAIMER

from apps.frameworks.models import ReadinessBand
from apps.recommendations.services import select_gap_dimensions, select_strength_dimensions

from .gates import resolve_overall_gate_status


def build_results_payload(assessment) -> dict:
    """Full results payload for GET /assessments/{id}/results/, per
    docs/06_API_ARCHITECTURE.md. The frontend renders this as-is -- it never
    recomputes the score, gate status, recommendations or pathways itself.
    """
    abi_score = assessment.abi_score
    dimension_scores = list(
        assessment.dimension_scores.select_related("dimension").order_by(
            "dimension__display_order"
        )
    )
    gate_results = list(assessment.gate_results.select_related("gate").order_by("gate__display_order"))
    recommendations = list(
        assessment.recommendations.select_related("recommendation__dimension").order_by(
            "priority_rank"
        )
    )
    financing_pathways = list(
        assessment.financing_pathways.select_related("pathway").order_by("relevance_rank")
    )

    readiness_band = ReadinessBand.objects.get(
        framework_version=assessment.framework_version,
        code=abi_score.readiness_band_code,
    )

    strengths = select_strength_dimensions(dimension_scores)
    gaps = select_gap_dimensions(dimension_scores)

    return {
        "assessment_id": str(assessment.id),
        "abi_score": float(abi_score.total_score),
        "readiness_band": {"code": readiness_band.code, "label": readiness_band.label},
        "evidence_coverage_percent": float(abi_score.evidence_coverage_percent),
        "dimension_scores": [
            {
                "dimension": ds.dimension.name,
                "dimension_code": ds.dimension.code,
                "score": float(ds.raw_average),
                "weight_percent": float(ds.dimension.weight_percent),
            }
            for ds in dimension_scores
        ],
        "strengths": [ds.dimension.name for ds in strengths],
        "priority_gaps": [ds.dimension.name for ds in gaps],
        "critical_gates": [
            {"code": gr.gate.code, "name": gr.gate.name, "result": gr.result, "note": gr.note}
            for gr in gate_results
        ],
        "overall_gate_status": (
            resolve_overall_gate_status(gate_results) if gate_results else None
        ),
        "recommendations": [
            {
                "dimension": ar.recommendation.dimension.name,
                "text": ar.recommendation.text,
                "priority_rank": ar.priority_rank,
            }
            for ar in recommendations
        ],
        "financing_pathways": [
            {
                "code": afp.pathway.code,
                "name": afp.pathway.name,
                "description": afp.pathway.description,
                "relevance_rank": afp.relevance_rank,
            }
            for afp in financing_pathways
        ],
        "disclaimer": RESEARCH_PROTOTYPE_DISCLAIMER,
    }
