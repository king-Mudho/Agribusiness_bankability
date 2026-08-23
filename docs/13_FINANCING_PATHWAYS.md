# 13 — Financing pathway engine

Lives in `backend/apps/financing/`. This is a **recommendation engine, not a loan
approval engine**. Every surface that shows its output must use the label **"Potential
financing pathway"**, never "Approved loan" or similar. See `18_DATA_PRIVACY.md`.

## The nine financing instruments (seed content)

| Code | Name | Description | Suited readiness bands |
|---|---|---|---|
| `working_capital_facility` | Working-capital facility | Short-term finance for input purchase or the operating cycle. | Finance Ready with Conditions, Investment Ready |
| `asset_finance` | Asset finance / leasing | Financing equipment, irrigation or vehicles secured by the asset itself, rather than land title. | Developing Bankability, Finance Ready with Conditions |
| `contract_value_chain_finance` | Contract / value-chain finance | Finance advanced against a confirmed off-take or purchase agreement with a buyer. | Early-Stage Readiness, Developing Bankability, Finance Ready with Conditions |
| `warehouse_receipt_finance` | Warehouse receipt finance | Stored produce at a licensed warehouse used as loan collateral. | Developing Bankability, Finance Ready with Conditions |
| `insurance_linked_finance` | Insurance-linked finance | Credit unlocked or de-risked through parametric/index-based or asset insurance. | Pre-Bankable, Early-Stage Readiness, Developing Bankability |
| `blended_finance` | Blended finance | Donor or DFI guarantee/first-loss capital that de-risks commercial lending. | Early-Stage Readiness, Developing Bankability |
| `grant_technical_assistance` | Grant-supported technical assistance | Non-repayable support paired with capacity building. | Pre-Bankable, Early-Stage Readiness |
| `patient_capital` | Patient capital | Longer-tenor, flexible-return capital tolerant of early-stage risk. | Developing Bankability, Finance Ready with Conditions |
| `equity_investment` | Equity investment | Capital provided in exchange for an ownership stake. | Finance Ready with Conditions, Investment Ready |

## Selection logic

1. Determine the assessment's `readiness_band`.
2. Select every `FinancingPathwayDefinition` whose `suited_bands` includes that band.
3. Boost the ranking of any pathway that specifically addresses one of the assessment's
   `priority_gaps` (dimensions) — cross-reference against the mapping implied by
   `12_RECOMMENDATION_ENGINE.md` (e.g. weak Climate Resilience → surface
   `insurance_linked_finance` higher; weak Market Strength → surface
   `contract_value_chain_finance` higher).
4. Return the top 3–5 pathways, most relevant first.

## Output shape

`GET /api/v1/assessments/{id}/financing/` — see `06_API_ARCHITECTURE.md` for the
response shape.

## Zimbabwe context notes (for content/copy only, not scoring logic)

These may inform explanatory copy shown alongside each pathway in the UI:
- Warehouse receipt finance aligns with Zimbabwe's grain warehouse receipt system.
- Contract/value-chain finance is common in tobacco, cotton and horticulture out-grower
  schemes.
- Insurance-linked finance is particularly relevant given Zimbabwe's drought and El Niño
  exposure.
- Blended finance mirrors donor-backed guarantee facilities already operating in
  Zimbabwean agri-lending.
- Asset finance reduces reliance on land title as collateral — a known constraint for
  many enterprises post land reform.
