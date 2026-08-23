"""
The ABI scoring engine. Pure function: (assessment) -> ABIResult, reading the
framework definition (dimensions, weights, questions) and responses from the
database, per docs/10_SCORING_ENGINE.md. Never hardcodes a weight, question
or threshold -- everything is read from the assessment's FrameworkVersion.

This module performs reads only; nothing here writes to the database. See
apps.scoring.services for the persistence step called on submit.
"""

from collections import defaultdict
from dataclasses import dataclass
from decimal import ROUND_HALF_EVEN, Decimal

from apps.frameworks.models import Dimension, Question, ReadinessBand

from .exceptions import IncompleteAssessmentError

EVIDENCE_COVERAGE_THRESHOLD = 2

SCORING_ENGINE_VERSION = "1.0"


@dataclass
class DimensionScoreResult:
    dimension: Dimension
    raw_average: Decimal
    weighted_contribution: Decimal


@dataclass
class ABIResult:
    total_score: int
    dimension_scores: list[DimensionScoreResult]
    readiness_band: ReadinessBand
    evidence_coverage_percent: Decimal


def dimension_weighted_contribution(raw_average: Decimal, weight_percent: Decimal) -> Decimal:
    """Step 3 of docs/10_SCORING_ENGINE.md: weighted_contribution = raw_average * weight_percent / 100."""
    return raw_average * weight_percent / Decimal(100)


def round_abi_total(total: Decimal) -> int:
    """Step 4: abi_score = round(sum(weighted_contribution for all dimensions))."""
    return int(total.quantize(Decimal("1"), rounding=ROUND_HALF_EVEN))


def resolve_readiness_band(total_score: int, framework_version) -> ReadinessBand:
    band = framework_version.readiness_bands.filter(
        min_score__lte=total_score, max_score__gte=total_score
    ).first()
    if band is None:
        raise ValueError(
            f"No readiness band on FrameworkVersion {framework_version.version_label} "
            f"covers score {total_score}."
        )
    return band


def compute_evidence_coverage_percent(assessment, all_questions) -> Decimal:
    """(questions with evidence_level >= 2) / total_questions * 100.

    Evidence may be captured per-question or per-dimension (docs/11_CRITICAL_GATES.md);
    a dimension-level record covers every question in that dimension unless a more
    specific per-question record exists.
    """
    question_level: dict[int, int] = {}
    dimension_level: dict[int, int] = {}
    for record in assessment.evidence_records.all():
        if record.question_id is not None:
            question_level[record.question_id] = record.evidence_level
        elif record.dimension_id is not None:
            dimension_level[record.dimension_id] = record.evidence_level

    total = len(all_questions)
    if total == 0:
        return Decimal("0")

    covered = 0
    for question in all_questions:
        level = question_level.get(question.id, dimension_level.get(question.dimension_id))
        if level is not None and level >= EVIDENCE_COVERAGE_THRESHOLD:
            covered += 1

    return (Decimal(covered) / Decimal(total) * Decimal(100)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_EVEN
    )


def compute_abi(assessment) -> ABIResult:
    framework_version = assessment.framework_version
    dimensions = list(framework_version.dimensions.all().order_by("display_order"))
    all_questions = list(
        Question.objects.filter(dimension__framework_version=framework_version).select_related(
            "dimension"
        )
    )
    responses = list(assessment.responses.select_related("question__dimension").all())

    answered_question_ids = {r.question_id for r in responses}
    missing = sorted(
        q.code for q in all_questions if q.id not in answered_question_ids
    )
    if missing:
        raise IncompleteAssessmentError(missing)

    responses_by_dimension: dict[int, list] = defaultdict(list)
    for response in responses:
        responses_by_dimension[response.question.dimension_id].append(response)

    dimension_scores = []
    for dimension in dimensions:
        dim_responses = responses_by_dimension[dimension.id]
        raw_average = Decimal(sum(r.score_value for r in dim_responses)) / Decimal(
            len(dim_responses)
        )
        weighted_contribution = dimension_weighted_contribution(
            raw_average, dimension.weight_percent
        )
        dimension_scores.append(
            DimensionScoreResult(
                dimension=dimension,
                raw_average=raw_average,
                weighted_contribution=weighted_contribution,
            )
        )

    total = sum((d.weighted_contribution for d in dimension_scores), Decimal("0"))
    total_score = round_abi_total(total)

    readiness_band = resolve_readiness_band(total_score, framework_version)
    evidence_coverage_percent = compute_evidence_coverage_percent(assessment, all_questions)

    return ABIResult(
        total_score=total_score,
        dimension_scores=dimension_scores,
        readiness_band=readiness_band,
        evidence_coverage_percent=evidence_coverage_percent,
    )
