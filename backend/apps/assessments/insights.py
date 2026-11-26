"""
Derived insights for the results screen, PDF/Excel reports and the admin
portal. Everything here is computed from the assessment's own persisted
scores plus the framework data in the database (dimension weights, readiness
band thresholds). Nothing is a hardcoded methodology value, and the ABI score
itself is never recomputed (docs/10_SCORING_ENGINE.md).

Peer benchmarks are aggregates only (docs/18_DATA_PRIVACY.md): an average is
shown only when at least MIN_PEER_SAMPLE other scored assessments contribute,
so no single enterprise's score can be read back out of it.
"""

from decimal import Decimal

from django.db.models import Avg

MIN_PEER_SAMPLE = 3


def _next_band(abi_score: float, framework_version):
    bands = list(framework_version.readiness_bands.order_by("min_score"))
    for band in bands:
        if band.min_score > abi_score:
            return {
                "code": band.code,
                "label": band.label,
                "min_score": band.min_score,
                "points_needed": round(band.min_score - abi_score, 1),
            }
    return None


def _improvement_potential(dimension_scores):
    """Points the overall ABI would gain if a dimension reached 100, using
    the framework's own weight for that dimension:
    weight_percent * (100 - score) / 100. Sorted largest first, so the top
    entries are where effort moves the overall score most.
    """
    rows = []
    for ds in dimension_scores:
        score = Decimal(ds.raw_average)
        weight = Decimal(ds.dimension.weight_percent)
        rows.append(
            {
                "dimension": ds.dimension.name,
                "dimension_code": ds.dimension.code,
                "score": float(score),
                "weight_percent": float(weight),
                "weighted_contribution": float(ds.weighted_contribution),
                "potential_points": float(round(weight * (Decimal(100) - score) / Decimal(100), 1)),
            }
        )
    rows.sort(key=lambda r: r["potential_points"], reverse=True)
    return rows


def _peer_benchmark(assessment):
    from apps.assessments.models import Assessment
    from apps.scoring.models import DimensionScore

    base = Assessment.objects.filter(
        status=Assessment.Status.SCORED,
        framework_version=assessment.framework_version,
        abi_score__isnull=False,
    ).exclude(pk=assessment.pk)

    value_chain = assessment.enterprise.value_chain
    groups = [
        ("value_chain", assessment.enterprise.get_value_chain_display(), base.filter(enterprise__value_chain=value_chain)),
        ("all", "All assessed enterprises", base),
    ]
    for group, label, qs in groups:
        sample = qs.count()
        if sample < MIN_PEER_SAMPLE:
            continue
        average_abi = qs.aggregate(avg=Avg("abi_score__total_score"))["avg"]
        dim_avgs = (
            DimensionScore.objects.filter(assessment__in=qs)
            .values("dimension__code")
            .annotate(avg=Avg("raw_average"))
        )
        return {
            "group": group,
            "label": label,
            "sample_size": sample,
            "average_abi": round(float(average_abi), 1) if average_abi is not None else None,
            "dimension_averages": {
                row["dimension__code"]: round(float(row["avg"]), 1) for row in dim_avgs
            },
        }
    return None


def build_insights(assessment, dimension_scores) -> dict:
    abi_score = float(assessment.abi_score.total_score)
    return {
        "next_band": _next_band(abi_score, assessment.framework_version),
        "improvement_potential": _improvement_potential(dimension_scores),
        "peer_benchmark": _peer_benchmark(assessment),
        "min_peer_sample": MIN_PEER_SAMPLE,
    }
