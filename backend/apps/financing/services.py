"""
Financing pathway selection logic per docs/13_FINANCING_PATHWAYS.md. This is
a recommendation engine, not a loan approval engine -- every consumer of
this module's output must present it as a "potential financing pathway"
(docs/18_DATA_PRIVACY.md), never an approval.

GAP_DIMENSION_TO_PATHWAY_BOOST fills in the four dimensions the source doc
does not spell out; see the "Phase 5" entry under docs/25_AGENT_EXECUTION_PLAN.md
§ Open questions for the rationale -- the two commented rows are the
doc-verbatim examples.
"""

from apps.recommendations.services import select_gap_dimensions

from .models import AssessmentFinancingPathway, FinancingPathwayDefinition

TOP_N_PATHWAYS = 5

GAP_DIMENSION_TO_PATHWAY_BOOST = {
    "financial_performance": ["working_capital_facility", "patient_capital"],
    "governance_management": ["grant_technical_assistance"],
    "market_strength": ["contract_value_chain_finance"],  # documented example
    "operational_capacity": ["asset_finance"],
    "climate_resilience": ["insurance_linked_finance"],  # documented example
    "digital_readiness": [],
}


def select_financing_pathways(assessment, readiness_band_code, dimension_scores):
    """1. Filter FinancingPathwayDefinition rows suited to the readiness band.
    2. Boost the rank of any pathway addressing one of the priority gap
       dimensions.
    3. Return the top 3-5, most relevant first.
    """
    candidates = list(
        FinancingPathwayDefinition.objects.filter(
            framework_version=assessment.framework_version,
            suited_bands__contains=[readiness_band_code],
        )
    )

    gap_dimension_codes = {
        ds.dimension.code for ds in select_gap_dimensions(dimension_scores)
    }
    boosted_codes = set()
    for dim_code in gap_dimension_codes:
        boosted_codes.update(GAP_DIMENSION_TO_PATHWAY_BOOST.get(dim_code, []))

    def sort_key(pathway):
        return (0 if pathway.code in boosted_codes else 1, pathway.name)

    ranked = sorted(candidates, key=sort_key)
    return ranked[:TOP_N_PATHWAYS]


def generate_financing_pathways(assessment, readiness_band_code, dimension_scores):
    pathways = select_financing_pathways(assessment, readiness_band_code, dimension_scores)

    AssessmentFinancingPathway.objects.filter(assessment=assessment).delete()

    created = []
    for rank, pathway in enumerate(pathways, start=1):
        created.append(
            AssessmentFinancingPathway.objects.create(
                assessment=assessment, pathway=pathway, relevance_rank=rank
            )
        )
    return created
