"""
Aggregate research/lender dashboard per docs/15_DASHBOARD_SPECIFICATION.md.

Hard privacy rule (docs/18_DATA_PRIVACY.md): this payload must NEVER include
Enterprise.name, exact turnover/finance figures, or any individual
assessment's free-text notes -- only banded/aggregated figures, grouped by
category. See tests/test_research_dashboard_privacy.py for the enforcement
test.
"""

from collections import Counter
from datetime import datetime

from django.db.models import Avg, Count

from apps.assessments.models import Assessment
from apps.frameworks.models import ReadinessBand
from apps.recommendations.services import select_gap_dimensions
from apps.scoring.models import DimensionScore


def _apply_filters(queryset, params):
    value_chain = params.get("value_chain")
    province = params.get("province")
    readiness_band = params.get("readiness_band")
    date_from = params.get("date_from")
    date_to = params.get("date_to")

    if value_chain:
        queryset = queryset.filter(enterprise__value_chain=value_chain)
    if province:
        queryset = queryset.filter(enterprise__province=province)
    if readiness_band:
        queryset = queryset.filter(abi_score__readiness_band_code=readiness_band)
    if date_from:
        queryset = queryset.filter(submitted_at__date__gte=datetime.fromisoformat(date_from).date())
    if date_to:
        queryset = queryset.filter(submitted_at__date__lte=datetime.fromisoformat(date_to).date())
    return queryset


def _score_bucket(score: float) -> str:
    lower = int(score) // 10 * 10
    upper = min(lower + 9, 100)
    return f"{lower}-{upper}"


def build_dashboard_payload(params) -> dict:
    assessments = (
        Assessment.objects.filter(status=Assessment.Status.SCORED)
        .select_related("abi_score", "enterprise")
    )
    assessments = _apply_filters(assessments, params)
    total = assessments.count()

    if total == 0:
        return {
            "total_assessments": 0,
            "average_abi": None,
            "band_percentages": {},
            "abi_distribution": {},
            "average_score_by_dimension": {},
            "by_value_chain": [],
            "by_province": [],
            "financing_needs_breakdown": {},
            "most_common_gaps": [],
            "evidence_coverage_average": None,
            "critical_gate_failure_frequency": {},
        }

    average_abi = assessments.aggregate(avg=Avg("abi_score__total_score"))["avg"]
    evidence_avg = assessments.aggregate(avg=Avg("abi_score__evidence_coverage_percent"))["avg"]

    band_counts = Counter(a.abi_score.readiness_band_code for a in assessments)
    band_labels = {
        b.code: b.label
        for b in ReadinessBand.objects.filter(
            framework_version__in=assessments.values_list("framework_version", flat=True).distinct()
        )
    }
    band_percentages = {
        band_labels.get(code, code): round(count / total * 100, 1)
        for code, count in band_counts.items()
    }

    distribution = Counter(_score_bucket(float(a.abi_score.total_score)) for a in assessments)

    dimension_scores = DimensionScore.objects.filter(assessment__in=assessments).select_related(
        "dimension"
    )
    dim_totals: dict[str, list] = {}
    for ds in dimension_scores:
        dim_totals.setdefault(ds.dimension.name, []).append(float(ds.raw_average))
    average_score_by_dimension = {
        name: round(sum(values) / len(values), 1) for name, values in dim_totals.items()
    }

    by_value_chain = list(
        assessments.values("enterprise__value_chain")
        .annotate(count=Count("id"), average_abi=Avg("abi_score__total_score"))
        .order_by("-count")
    )
    by_value_chain = [
        {
            "value_chain": row["enterprise__value_chain"],
            "count": row["count"],
            "average_abi": round(float(row["average_abi"]), 1) if row["average_abi"] is not None else None,
        }
        for row in by_value_chain
    ]

    by_province = list(
        assessments.values("enterprise__province")
        .annotate(count=Count("id"), average_abi=Avg("abi_score__total_score"))
        .order_by("-count")
    )
    by_province = [
        {
            "province": row["enterprise__province"],
            "count": row["count"],
            "average_abi": round(float(row["average_abi"]), 1) if row["average_abi"] is not None else None,
        }
        for row in by_province
    ]

    financing_needs = Counter(
        a.enterprise.profile.finance_type_sought
        for a in assessments
        if hasattr(a.enterprise, "profile")
    )

    gap_counter = Counter()
    for assessment in assessments:
        dim_scores = list(assessment.dimension_scores.select_related("dimension").all())
        for ds in select_gap_dimensions(dim_scores):
            gap_counter[ds.dimension.name] += 1
    most_common_gaps = [
        {"dimension": name, "count": count} for name, count in gap_counter.most_common()
    ]

    gate_failures = Counter()
    for assessment in assessments:
        for gate_result in assessment.gate_results.select_related("gate").all():
            if gate_result.result != "PASS":
                gate_failures[gate_result.gate.name] += 1

    return {
        "total_assessments": total,
        "average_abi": round(float(average_abi), 1) if average_abi is not None else None,
        "band_percentages": band_percentages,
        "abi_distribution": dict(sorted(distribution.items())),
        "average_score_by_dimension": average_score_by_dimension,
        "by_value_chain": by_value_chain,
        "by_province": by_province,
        "financing_needs_breakdown": dict(financing_needs),
        "most_common_gaps": most_common_gaps,
        "evidence_coverage_average": round(float(evidence_avg), 1) if evidence_avg is not None else None,
        "critical_gate_failure_frequency": dict(gate_failures),
    }
