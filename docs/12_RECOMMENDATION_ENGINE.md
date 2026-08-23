# 12 — Recommendation engine

Lives in `backend/apps/recommendations/`. Maps a scored assessment's weakest dimensions
to concrete, pre-authored improvement actions. The *text* of each recommendation lives
in the `Recommendation` table (seeded per `FrameworkVersion`, see `24_SEED_DATA.md`); the
*selection logic* (which recommendations to attach to a given assessment, and in what
order) lives in Python.

## Selection logic

1. Rank the six `DimensionScore` rows for the assessment ascending by `raw_average`.
2. Take the two or three lowest-scoring dimensions (configurable; default: dimensions
   scoring below 60, capped at 3).
3. For each selected dimension, attach its pre-authored `Recommendation` rows via
   `AssessmentRecommendation`, ordered by `priority_rank` (weight the ranking by
   `dimension.weight_percent × (60 - raw_average)` — bigger weight and bigger gap sort
   first).

## Recommendation text by dimension (seed content)

### Financial Performance
- Strengthen bookkeeping practices and move toward regularly updated financial records.
- Prepare rolling cash-flow forecasts and management accounts.
- Track and improve repayment discipline on any existing credit or supplier terms.

### Governance and Management
- Formalise roles, responsibilities and decision-making authority in writing.
- Introduce basic internal controls and an approvals/decision register.
- Identify and close specific technical or commercial capability gaps in management.

### Market Strength
- Pursue written purchase or off-take agreements with buyers.
- Diversify the customer/buyer base to reduce reliance on a single market.
- Build basic market intelligence on pricing, demand and competitor activity.

### Operational Capacity
- Strengthen production planning to improve consistency of output.
- Introduce quality-control procedures for inputs and outputs.
- Improve traceability records across the production or supply process.

### Climate Resilience
- Develop a written climate-risk management plan for the enterprise.
- Explore index-based, weather, or asset insurance appropriate to the value chain.
- Build business-continuity contingencies for water, energy or input disruption.

### Digital Readiness
- Adopt a digital record-keeping tool for core transactions.
- Migrate routine payments to digital or mobile-money channels.
- Build a transaction history that can be shared with a financier or investor on request.

## Output shape

`GET /api/v1/assessments/{id}/recommendations/` returns the attached recommendations in
priority order, each tagged with its source dimension — see `06_API_ARCHITECTURE.md`.

## Language rule

Recommendations are phrased as **actions the enterprise can take**, never as conditions
a lender has imposed — this stays consistent with the "prototype, not a lending
decision" framing in `18_DATA_PRIVACY.md`.
