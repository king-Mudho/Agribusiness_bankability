"""
Seed FrameworkVersion 0.1 exactly as specified in docs/09_ABI_FRAMEWORK.md,
docs/11_CRITICAL_GATES.md, docs/12_RECOMMENDATION_ENGINE.md,
docs/13_FINANCING_PATHWAYS.md and the two demo enterprises from
docs/24_SEED_DATA.md.

Idempotent: safe to re-run against a fresh or already-seeded database.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Role
from apps.assessments.models import Assessment, AssessmentResponse, CriticalGateResult
from apps.enterprises.models import Enterprise, EnterpriseProfile
from apps.evidence.models import EvidenceRecord
from apps.financing.models import FinancingPathwayDefinition
from apps.frameworks.models import (
    CriticalGateDefinition,
    Dimension,
    FrameworkVersion,
    Question,
    ReadinessBand,
    ResponseOption,
)
from apps.recommendations.models import Recommendation

FRAMEWORK_VERSION_LABEL = "0.1"

# --- docs/09_ABI_FRAMEWORK.md -------------------------------------------------

RESPONSE_SCALE = [
    (1, "Not at all / strongly disagree", 0),
    (2, "To a limited extent", 25),
    (3, "Partially / moderately", 50),
    (4, "To a large extent", 75),
    (5, "Fully / strongly agree", 100),
]

DIMENSIONS = [
    {
        "code": "financial_performance",
        "name": "Financial Performance",
        "weight_percent": Decimal("25"),
        "questions": [
            ("fin_01", "The enterprise maintains complete, current and reliable financial records."),
            ("fin_02", "The enterprise prepares cash-flow forecasts and operating budgets."),
            ("fin_03", "The enterprise generates sufficient income to cover operating costs and debt service."),
            ("fin_04", "The enterprise has an acceptable repayment history on any prior credit or supplier terms."),
        ],
    },
    {
        "code": "governance_management",
        "name": "Governance and Management",
        "weight_percent": Decimal("15"),
        "questions": [
            ("gov_01", "Management roles, responsibilities and decision-making authority are clearly defined."),
            ("gov_02", "Important business decisions and approvals are documented."),
            ("gov_03", "The enterprise maintains effective financial and operational controls."),
            ("gov_04", "Management has adequate technical and commercial capability to run the enterprise."),
        ],
    },
    {
        "code": "market_strength",
        "name": "Market Strength",
        "weight_percent": Decimal("20"),
        "questions": [
            ("mkt_01", "The enterprise has credible, documented buyer or off-taker relationships."),
            ("mkt_02", "The enterprise has a track record of honouring contractual or supply commitments."),
            ("mkt_03", "Contracts or market arrangements provide reasonably predictable demand and pricing."),
            ("mkt_04", "The enterprise can consistently meet agreed quantity and quality requirements."),
        ],
    },
    {
        "code": "operational_capacity",
        "name": "Operational Capacity",
        "weight_percent": Decimal("15"),
        "questions": [
            ("ops_01", "The enterprise has secure and documented access to the land, facilities or premises it operates from."),
            ("ops_02", "Production or operational infrastructure is adequate and reliably maintained."),
            ("ops_03", "The enterprise can consistently meet its planned production or service volumes."),
            ("ops_04", "The enterprise has access to the inputs, labour and technical support it needs to operate."),
        ],
    },
    {
        "code": "climate_resilience",
        "name": "Climate Resilience",
        "weight_percent": Decimal("15"),
        "questions": [
            ("cli_01", "The enterprise has identified the key climate and weather-related risks to its operations."),
            ("cli_02", "The enterprise has taken practical steps to reduce exposure to drought, flooding or extreme weather."),
            ("cli_03", "The enterprise has access to water, energy or inputs that remain reliable under climate stress."),
            ("cli_04", "The enterprise holds, or is actively pursuing, insurance or another formal risk-transfer mechanism."),
        ],
    },
    {
        "code": "digital_readiness",
        "name": "Digital Readiness",
        "weight_percent": Decimal("10"),
        "questions": [
            ("dig_01", "Important business transactions are digitally recorded."),
            ("dig_02", "The enterprise can produce a reliable digital transaction history on request."),
            ("dig_03", "The enterprise uses digital payment or mobile money channels for business transactions."),
            ("dig_04", "Digital records are available and could be shared with a financier or investor if requested."),
        ],
    },
]

READINESS_BANDS = [
    ("investment_ready", "Investment Ready", 80, 100),
    ("finance_ready_conditions", "Finance Ready with Conditions", 65, 79),
    ("developing_bankability", "Developing Bankability", 50, 64),
    ("early_stage_readiness", "Early-Stage Readiness", 35, 49),
    ("pre_bankable", "Pre-Bankable", 0, 34),
]

# --- docs/11_CRITICAL_GATES.md ------------------------------------------------

CRITICAL_GATES = [
    (
        "legal_identity",
        "Legal identity",
        "Is the enterprise a legally identifiable entity (registered business, cooperative, "
        "or verifiable sole trader) with traceable ownership?",
    ),
    (
        "financial_records",
        "Financial records",
        "Does the enterprise have any financial records -- even informal ones -- that a "
        "financier could review?",
    ),
    (
        "source_of_repayment",
        "Source of repayment",
        "Is there an identifiable, plausible source of income or revenue from which "
        "financing could be repaid?",
    ),
    (
        "market_revenue_opportunity",
        "Market / revenue opportunity",
        "Is there evidence of an actual market or revenue opportunity (real buyers, "
        "demonstrated demand) rather than a purely speculative concept?",
    ),
    (
        "fraud_default_concerns",
        "Fraud / serious default concerns",
        "Are there no known indicators of fraud, serious credit default, or integrity concerns?",
    ),
]

# --- docs/12_RECOMMENDATION_ENGINE.md -----------------------------------------

RECOMMENDATIONS = {
    "financial_performance": [
        "Strengthen bookkeeping practices and move toward regularly updated financial records.",
        "Prepare rolling cash-flow forecasts and management accounts.",
        "Track and improve repayment discipline on any existing credit or supplier terms.",
    ],
    "governance_management": [
        "Formalise roles, responsibilities and decision-making authority in writing.",
        "Introduce basic internal controls and an approvals/decision register.",
        "Identify and close specific technical or commercial capability gaps in management.",
    ],
    "market_strength": [
        "Pursue written purchase or off-take agreements with buyers.",
        "Diversify the customer/buyer base to reduce reliance on a single market.",
        "Build basic market intelligence on pricing, demand and competitor activity.",
    ],
    "operational_capacity": [
        "Strengthen production planning to improve consistency of output.",
        "Introduce quality-control procedures for inputs and outputs.",
        "Improve traceability records across the production or supply process.",
    ],
    "climate_resilience": [
        "Develop a written climate-risk management plan for the enterprise.",
        "Explore index-based, weather, or asset insurance appropriate to the value chain.",
        "Build business-continuity contingencies for water, energy or input disruption.",
    ],
    "digital_readiness": [
        "Adopt a digital record-keeping tool for core transactions.",
        "Migrate routine payments to digital or mobile-money channels.",
        "Build a transaction history that can be shared with a financier or investor on request.",
    ],
}

# --- docs/13_FINANCING_PATHWAYS.md --------------------------------------------

FINANCING_PATHWAYS = [
    (
        "working_capital_facility",
        "Working-capital facility",
        "Short-term finance for input purchase or the operating cycle.",
        ["finance_ready_conditions", "investment_ready"],
    ),
    (
        "asset_finance",
        "Asset finance / leasing",
        "Financing equipment, irrigation or vehicles secured by the asset itself, rather than "
        "land title.",
        ["developing_bankability", "finance_ready_conditions"],
    ),
    (
        "contract_value_chain_finance",
        "Contract / value-chain finance",
        "Finance advanced against a confirmed off-take or purchase agreement with a buyer.",
        ["early_stage_readiness", "developing_bankability", "finance_ready_conditions"],
    ),
    (
        "warehouse_receipt_finance",
        "Warehouse receipt finance",
        "Stored produce at a licensed warehouse used as loan collateral.",
        ["developing_bankability", "finance_ready_conditions"],
    ),
    (
        "insurance_linked_finance",
        "Insurance-linked finance",
        "Credit unlocked or de-risked through parametric/index-based or asset insurance.",
        ["pre_bankable", "early_stage_readiness", "developing_bankability"],
    ),
    (
        "blended_finance",
        "Blended finance",
        "Donor or DFI guarantee/first-loss capital that de-risks commercial lending.",
        ["early_stage_readiness", "developing_bankability"],
    ),
    (
        "grant_technical_assistance",
        "Grant-supported technical assistance",
        "Non-repayable support paired with capacity building.",
        ["pre_bankable", "early_stage_readiness"],
    ),
    (
        "patient_capital",
        "Patient capital",
        "Longer-tenor, flexible-return capital tolerant of early-stage risk.",
        ["developing_bankability", "finance_ready_conditions"],
    ),
    (
        "equity_investment",
        "Equity investment",
        "Capital provided in exchange for an ownership stake.",
        ["finance_ready_conditions", "investment_ready"],
    ),
]

# --- docs/24_SEED_DATA.md: demo enterprises -----------------------------------
# Scale values (1-5) per question, chosen so the resulting dimension averages
# and overall ABI score land in the documented target band. See the worked
# arithmetic in the phase-2 commit notes / tests/test_seed_demo_bands.py.

MAUNDURAHUKU_RESPONSES = {
    "financial_performance": [2, 3, 4, 4],
    "governance_management": [3, 3, 4, 4],
    "market_strength": [4, 4, 4, 5],
    "operational_capacity": [2, 3, 4, 4],
    "climate_resilience": [3, 3, 3, 3],
    "digital_readiness": [1, 2, 2, 2],
}
MAUNDURAHUKU_EVIDENCE = {
    "financial_performance": 3,
    "governance_management": 2,
    "market_strength": 3,
    "operational_capacity": 1,
    "climate_resilience": 1,
    "digital_readiness": 0,
}
MAUNDURAHUKU_GATES = {
    "legal_identity": ("PASS", ""),
    "financial_records": ("PASS", ""),
    "source_of_repayment": (
        "CAUTION",
        "Seasonal income only, no off-season buffer identified.",
    ),
    "market_revenue_opportunity": ("PASS", ""),
    "fraud_default_concerns": ("PASS", ""),
}

ZVEMUCHANDO_RESPONSES = {
    "financial_performance": [4, 4, 4, 4],
    "governance_management": [4, 5, 5, 5],
    "market_strength": [4, 4, 4, 4],
    "operational_capacity": [3, 4, 4, 4],
    "climate_resilience": [2, 2, 2, 2],
    "digital_readiness": [3, 3, 4, 4],
}
ZVEMUCHANDO_EVIDENCE = {
    "financial_performance": 3,
    "governance_management": 4,
    "market_strength": 3,
    "operational_capacity": 2,
    "climate_resilience": 1,
    "digital_readiness": 2,
}
ZVEMUCHANDO_GATES = {
    "legal_identity": ("PASS", ""),
    "financial_records": ("PASS", ""),
    "source_of_repayment": ("PASS", ""),
    "market_revenue_opportunity": ("PASS", ""),
    "fraud_default_concerns": ("PASS", ""),
}


class Command(BaseCommand):
    help = "Seed FrameworkVersion 0.1 and the two demo enterprises (docs/24_SEED_DATA.md)."

    @transaction.atomic
    def handle(self, *args, **options):
        fv = self._seed_framework_version()
        dimensions = self._seed_dimensions(fv)
        self._seed_response_options(fv)
        self._seed_critical_gates(fv)
        self._seed_readiness_bands(fv)
        self._seed_recommendations(fv, dimensions)
        self._seed_financing_pathways(fv)
        self._seed_roles()

        weight_sum = fv.dimensions_weight_sum()
        if weight_sum != 100:
            self.stderr.write(
                self.style.ERROR(f"Dimension weights sum to {weight_sum}, not 100!")
            )
        else:
            self.stdout.write(self.style.SUCCESS("Dimension weights sum to 100."))

        maundurahuku = self._seed_enterprise(
            code="DEMO-MAUNDURAHUKU",
            name="Maundurahuku",
            organisation_type="COOPERATIVE",
            value_chain="GRAIN",
            province="MASHONALAND_CENTRAL",
            district="Mazowe",
            years_operating=6,
            workers_count=24,
            turnover_band="USD_50K_250K",
            finance_required_amount=Decimal("35000.00"),
            finance_type_sought="WORKING_CAPITAL",
            preferred_financier_type="BANK",
        )
        self._seed_demo_assessment(
            enterprise=maundurahuku,
            framework_version=fv,
            responses=MAUNDURAHUKU_RESPONSES,
            evidence=MAUNDURAHUKU_EVIDENCE,
            gates=MAUNDURAHUKU_GATES,
        )

        zvemuchando = self._seed_enterprise(
            code="DEMO-ZVEMUCHANDO",
            name="Zvemuchando",
            organisation_type="PRIVATE_COMPANY",
            value_chain="HORTICULTURE",
            province="MASHONALAND_EAST",
            district="Marondera",
            years_operating=9,
            workers_count=41,
            turnover_band="USD_250K_1M",
            finance_required_amount=Decimal("120000.00"),
            finance_type_sought="ASSET_FINANCE",
            preferred_financier_type="DEVELOPMENT_FINANCE",
        )
        self._seed_demo_assessment(
            enterprise=zvemuchando,
            framework_version=fv,
            responses=ZVEMUCHANDO_RESPONSES,
            evidence=ZVEMUCHANDO_EVIDENCE,
            gates=ZVEMUCHANDO_GATES,
        )

        self.stdout.write(self.style.SUCCESS("Seed complete."))

    def _seed_framework_version(self):
        fv, _ = FrameworkVersion.objects.get_or_create(
            version_label=FRAMEWORK_VERSION_LABEL,
            defaults={
                "status": FrameworkVersion.Status.ACTIVE,
                "effective_from": timezone.now(),
                "notes": "Canonical FrameworkVersion 0.1 per docs/09_ABI_FRAMEWORK.md.",
            },
        )
        if fv.status != FrameworkVersion.Status.ACTIVE:
            fv.status = FrameworkVersion.Status.ACTIVE
            fv.save(update_fields=["status"])
        return fv

    def _seed_dimensions(self, fv):
        dimensions = {}
        for order, dim in enumerate(DIMENSIONS, start=1):
            dimension, _ = Dimension.objects.update_or_create(
                framework_version=fv,
                code=dim["code"],
                defaults={
                    "name": dim["name"],
                    "weight_percent": dim["weight_percent"],
                    "display_order": order,
                },
            )
            dimensions[dim["code"]] = dimension
            for q_order, (q_code, prompt) in enumerate(dim["questions"], start=1):
                Question.objects.update_or_create(
                    dimension=dimension,
                    code=q_code,
                    defaults={"prompt": prompt, "display_order": q_order},
                )
        return dimensions

    def _seed_response_options(self, fv):
        for scale_value, label, score_value in RESPONSE_SCALE:
            ResponseOption.objects.update_or_create(
                framework_version=fv,
                question=None,
                scale_value=scale_value,
                defaults={"label": label, "score_value": score_value},
            )

    def _seed_critical_gates(self, fv):
        for order, (code, name, description) in enumerate(CRITICAL_GATES, start=1):
            CriticalGateDefinition.objects.update_or_create(
                framework_version=fv,
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "display_order": order,
                },
            )

    def _seed_readiness_bands(self, fv):
        for order, (code, label, min_score, max_score) in enumerate(READINESS_BANDS, start=1):
            ReadinessBand.objects.update_or_create(
                framework_version=fv,
                code=code,
                defaults={
                    "label": label,
                    "min_score": min_score,
                    "max_score": max_score,
                    "display_order": order,
                },
            )

    def _seed_recommendations(self, fv, dimensions):
        for dim_code, texts in RECOMMENDATIONS.items():
            for order, text in enumerate(texts, start=1):
                Recommendation.objects.update_or_create(
                    framework_version=fv,
                    dimension=dimensions[dim_code],
                    text=text,
                    defaults={"display_order": order},
                )

    def _seed_financing_pathways(self, fv):
        for code, name, description, suited_bands in FINANCING_PATHWAYS:
            FinancingPathwayDefinition.objects.update_or_create(
                framework_version=fv,
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "suited_bands": suited_bands,
                },
            )

    def _seed_roles(self):
        for value, _label in Role.NAME_CHOICES:
            Role.objects.get_or_create(name=value)

    def _seed_enterprise(
        self,
        *,
        code,
        name,
        organisation_type,
        value_chain,
        province,
        district,
        years_operating,
        workers_count,
        turnover_band,
        finance_required_amount,
        finance_type_sought,
        preferred_financier_type,
    ):
        enterprise, _ = Enterprise.objects.update_or_create(
            code=code,
            defaults={
                "name": name,
                "anonymous_respondent_code": f"ANON-{code}",
                "organisation_type": organisation_type,
                "value_chain": value_chain,
                "province": province,
                "district": district,
                "years_operating": years_operating,
                "workers_count": workers_count,
                "turnover_band": turnover_band,
            },
        )
        EnterpriseProfile.objects.update_or_create(
            enterprise=enterprise,
            defaults={
                "finance_required_amount": finance_required_amount,
                "finance_required_currency": "USD",
                "finance_type_sought": finance_type_sought,
                "intended_use": "Demonstration profile seeded for the Agricultural Show pilot.",
                "previous_borrowing": True,
                "previous_borrowing_notes": "Seeded demo data -- see docs/24_SEED_DATA.md.",
                "preferred_financier_type": preferred_financier_type,
                "consent_given": True,
                "consent_timestamp": timezone.now(),
            },
        )
        return enterprise

    def _seed_demo_assessment(self, *, enterprise, framework_version, responses, evidence, gates):
        # Remove any previously seeded template assessment for this enterprise so
        # re-running the command doesn't accumulate duplicates.
        Assessment.objects.filter(
            enterprise=enterprise, framework_version=framework_version
        ).delete()

        assessment = Assessment.objects.create(
            enterprise=enterprise,
            framework_version=framework_version,
            status=Assessment.Status.SUBMITTED,
            submitted_at=timezone.now(),
            offline_created=False,
        )

        score_lookup = {scale_value: score for scale_value, _label, score in RESPONSE_SCALE}
        for dim in DIMENSIONS:
            dim_code = dim["code"]
            scale_values = responses[dim_code]
            for (q_code, _prompt), scale_value in zip(dim["questions"], scale_values):
                question = Question.objects.get(dimension__framework_version=framework_version, code=q_code)
                AssessmentResponse.objects.create(
                    assessment=assessment,
                    question=question,
                    scale_value=scale_value,
                    score_value=score_lookup[scale_value],
                )
                EvidenceRecord.objects.create(
                    assessment=assessment,
                    question=question,
                    evidence_level=evidence[dim_code],
                )

        for gate_code, (result, note) in gates.items():
            gate = CriticalGateDefinition.objects.get(
                framework_version=framework_version, code=gate_code
            )
            CriticalGateResult.objects.create(
                assessment=assessment, gate=gate, result=result, note=note
            )

        return assessment
