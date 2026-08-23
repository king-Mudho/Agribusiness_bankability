import pytest
from rest_framework.test import APIClient

QUESTION_CODES = [f"{prefix}_{i:02d}" for prefix in ("fin", "gov", "mkt", "ops", "cli", "dig") for i in range(1, 5)]

GATE_CODES = [
    "legal_identity",
    "financial_records",
    "source_of_repayment",
    "market_revenue_opportunity",
    "fraud_default_concerns",
]


@pytest.fixture
def api_client():
    return APIClient()


def _enterprise_payload():
    return {
        "name": "Happy Path Farm",
        "organisation_type": "COOPERATIVE",
        "value_chain": "GRAIN",
        "province": "HARARE",
        "district": "Chitungwiza",
        "years_operating": 5,
        "workers_count": 10,
        "turnover_band": "USD_10K_50K",
        "profile": {
            "finance_required_amount": "15000.00",
            "finance_type_sought": "WORKING_CAPITAL",
            "preferred_financier_type": "BANK",
            "intended_use": "inputs",
            "previous_borrowing": False,
        },
    }


@pytest.mark.django_db
def test_full_happy_path(api_client, seeded_db):
    # 1. Create enterprise (Step 01 of the wizard).
    resp = api_client.post("/api/v1/enterprises/", _enterprise_payload(), format="json")
    assert resp.status_code == 201, resp.data
    enterprise_id = resp.data["id"]
    assert resp.data["profile"]["consent_given"] is False

    # 2. Consent (Step 02).
    resp = api_client.patch(
        f"/api/v1/enterprises/{enterprise_id}/", {"profile": {"consent_given": True}}, format="json"
    )
    assert resp.status_code == 200, resp.data
    assert resp.data["profile"]["consent_given"] is True
    assert resp.data["profile"]["consent_timestamp"] is not None

    # 3. Start assessment.
    resp = api_client.post("/api/v1/assessments/", {"enterprise": enterprise_id}, format="json")
    assert resp.status_code == 201, resp.data
    assessment_id = resp.data["id"]
    assert resp.data["status"] == "DRAFT"

    # 4. Submit responses for all 24 questions (Steps 03-08).
    responses = [{"question_code": code, "scale_value": 4} for code in QUESTION_CODES]
    resp = api_client.put(
        f"/api/v1/assessments/{assessment_id}/responses/", {"responses": responses}, format="json"
    )
    assert resp.status_code == 200
    assert resp.data["saved"] == 24

    # 5. Submit gate results (Step 09).
    gates = [{"gate_code": code, "result": "PASS"} for code in GATE_CODES]
    resp = api_client.put(f"/api/v1/assessments/{assessment_id}/gates/", {"gates": gates}, format="json")
    assert resp.status_code == 200
    assert resp.data["saved"] == 5

    # 6. Evidence (optional, dimension-level).
    evidence = [{"dimension_code": "financial_performance", "evidence_level": 3}]
    resp = api_client.put(
        f"/api/v1/assessments/{assessment_id}/evidence/", {"evidence": evidence}, format="json"
    )
    assert resp.status_code == 200
    assert resp.data["saved"] == 1

    # 7. Submit (Step 10) -- triggers scoring.
    resp = api_client.post(f"/api/v1/assessments/{assessment_id}/submit/")
    assert resp.status_code == 200, resp.data
    assert resp.data["abi_score"] == 75.0  # all responses scale_value=4 -> score_value 75 everywhere
    assert resp.data["readiness_band"]["code"] == "finance_ready_conditions"
    assert resp.data["overall_gate_status"] == "Ready"
    assert "disclaimer" in resp.data and "provisional" in resp.data["disclaimer"]

    # 8. Fetch results/score independently -- must exactly match what submit returned.
    results_resp = api_client.get(f"/api/v1/assessments/{assessment_id}/results/")
    assert results_resp.status_code == 200
    assert results_resp.data["abi_score"] == resp.data["abi_score"]

    score_resp = api_client.get(f"/api/v1/assessments/{assessment_id}/score/")
    assert score_resp.status_code == 200
    assert score_resp.data["abi_score"] == resp.data["abi_score"]

    # 9. Recommendations / financing pathways available.
    rec_resp = api_client.get(f"/api/v1/assessments/{assessment_id}/recommendations/")
    assert rec_resp.status_code == 200

    fin_resp = api_client.get(f"/api/v1/assessments/{assessment_id}/financing/")
    assert fin_resp.status_code == 200

    # 10. Pilot feedback.
    feedback_resp = api_client.post(
        f"/api/v1/assessments/{assessment_id}/feedback/",
        {
            "score_reflects_enterprise": True,
            "would_help_prepare_for_finance": True,
            "willing_to_provide_evidence_later": True,
            "perceived_duration_minutes": 11,
            "would_recommend": True,
        },
        format="json",
    )
    assert feedback_resp.status_code == 201


@pytest.mark.django_db
def test_submit_rejects_incomplete_assessment(api_client, seeded_db):
    resp = api_client.post("/api/v1/enterprises/", _enterprise_payload(), format="json")
    enterprise_id = resp.data["id"]
    api_client.patch(
        f"/api/v1/enterprises/{enterprise_id}/", {"profile": {"consent_given": True}}, format="json"
    )
    resp = api_client.post("/api/v1/assessments/", {"enterprise": enterprise_id}, format="json")
    assessment_id = resp.data["id"]

    # Only answer 23 of 24 questions.
    responses = [{"question_code": code, "scale_value": 3} for code in QUESTION_CODES[:-1]]
    api_client.put(f"/api/v1/assessments/{assessment_id}/responses/", {"responses": responses}, format="json")

    resp = api_client.post(f"/api/v1/assessments/{assessment_id}/submit/")
    assert resp.status_code == 400
    assert resp.data["error"]["code"] == "incomplete_assessment"
    assert QUESTION_CODES[-1] in resp.data["error"]["field_errors"]["missing_question_codes"]


@pytest.mark.django_db
def test_results_before_scoring_returns_409(api_client, seeded_db):
    resp = api_client.post("/api/v1/enterprises/", _enterprise_payload(), format="json")
    enterprise_id = resp.data["id"]
    api_client.patch(
        f"/api/v1/enterprises/{enterprise_id}/", {"profile": {"consent_given": True}}, format="json"
    )
    resp = api_client.post("/api/v1/assessments/", {"enterprise": enterprise_id}, format="json")
    assessment_id = resp.data["id"]

    resp = api_client.get(f"/api/v1/assessments/{assessment_id}/results/")
    assert resp.status_code == 409


@pytest.mark.django_db
def test_load_demo_firm_reaches_results_immediately(api_client, seeded_db):
    resp = api_client.post(
        "/api/v1/assessments/load-demo/", {"enterprise_code": "DEMO-MAUNDURAHUKU"}, format="json"
    )
    assert resp.status_code == 201, resp.data
    assessment_id = resp.data["assessment_id"]

    results_resp = api_client.get(f"/api/v1/assessments/{assessment_id}/results/")
    assert results_resp.status_code == 200
    assert results_resp.data["readiness_band"]["code"] == "developing_bankability"


@pytest.mark.django_db
def test_schema_and_docs_endpoints_are_reachable(api_client, seeded_db):
    assert api_client.get("/api/schema/").status_code == 200
    assert api_client.get("/api/docs/").status_code == 200
