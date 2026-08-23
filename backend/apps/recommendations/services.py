"""
Recommendation selection logic per docs/12_RECOMMENDATION_ENGINE.md. The
*text* of each recommendation lives in the Recommendation table (seeded per
FrameworkVersion); only the *selection* (which dimensions/rows to attach to
a given assessment, and in what order) lives here.
"""

from decimal import Decimal

from .models import AssessmentRecommendation, Recommendation

GAP_SCORE_THRESHOLD = Decimal("60")
MAX_GAP_DIMENSIONS = 3
MIN_GAP_DIMENSIONS = 2


def select_gap_dimensions(
    dimension_scores,
    threshold: Decimal = GAP_SCORE_THRESHOLD,
    cap: int = MAX_GAP_DIMENSIONS,
    minimum: int = MIN_GAP_DIMENSIONS,
):
    """Rank DimensionScore rows ascending by raw_average and return the two
    or three lowest-scoring dimensions: every dimension below `threshold`,
    capped at `cap`, but never fewer than `minimum` even if none fall below
    the threshold.
    """
    below_threshold = sorted(
        (ds for ds in dimension_scores if ds.raw_average < threshold),
        key=lambda ds: ds.raw_average,
    )
    if len(below_threshold) >= minimum:
        return below_threshold[:cap]
    return sorted(dimension_scores, key=lambda ds: ds.raw_average)[:minimum]


def _urgency(dimension_score, threshold: Decimal = GAP_SCORE_THRESHOLD) -> Decimal:
    """Bigger dimension weight and bigger gap below the threshold sort first."""
    gap = threshold - dimension_score.raw_average
    return dimension_score.dimension.weight_percent * gap


def generate_recommendations(assessment, dimension_scores):
    """Selects gap dimensions, attaches their pre-authored Recommendation rows
    in priority order, and persists AssessmentRecommendation. Replaces any
    previously generated recommendations for this assessment (safe to
    re-score).
    """
    gap_dimensions = select_gap_dimensions(dimension_scores)
    gap_dimensions_ranked = sorted(gap_dimensions, key=_urgency, reverse=True)

    AssessmentRecommendation.objects.filter(assessment=assessment).delete()

    created = []
    rank = 1
    for dimension_score in gap_dimensions_ranked:
        recommendations = Recommendation.objects.filter(
            framework_version=assessment.framework_version,
            dimension=dimension_score.dimension,
        ).order_by("display_order")
        for recommendation in recommendations:
            created.append(
                AssessmentRecommendation.objects.create(
                    assessment=assessment,
                    recommendation=recommendation,
                    priority_rank=rank,
                )
            )
            rank += 1
    return created
