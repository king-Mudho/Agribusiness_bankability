# 09 — The ABI framework (Version 0.1, provisional)

This is the canonical methodology for `FrameworkVersion 0.1`. It must be seeded into the
database exactly as written here (see `24_SEED_DATA.md`) — do not hardcode it into
frontend or backend application code, and do not substitute the dimension names from the
`FrameworkVersion 0.0` reference screenshots (see `01_RESEARCH_CONTEXT.md`).

**Status**: provisional. Every question, weight and threshold below is subject to change
once expert review and pilot data come back — that is the point of this research project.

## Response scale

Every question uses the same five-point maturity scale:

| Scale value | Label | Score value |
|---|---|---|
| 1 | Not at all / strongly disagree | 0 |
| 2 | To a limited extent | 25 |
| 3 | Partially / moderately | 50 |
| 4 | To a large extent | 75 |
| 5 | Fully / strongly agree | 100 |

## The six dimensions (weights sum to 100)

| Code | Dimension | Weight |
|---|---|---|
| `financial_performance` | Financial Performance | 25% |
| `governance_management` | Governance and Management | 15% |
| `market_strength` | Market Strength | 20% |
| `operational_capacity` | Operational Capacity | 15% |
| `climate_resilience` | Climate Resilience | 15% |
| `digital_readiness` | Digital Readiness | 10% |

Four questions per dimension, 24 questions total.

## 1. Financial Performance — 25%

1. `fin_01` — The enterprise maintains complete, current and reliable financial records.
2. `fin_02` — The enterprise prepares cash-flow forecasts and operating budgets.
3. `fin_03` — The enterprise generates sufficient income to cover operating costs and
   debt service.
4. `fin_04` — The enterprise has an acceptable repayment history on any prior credit or
   supplier terms.

## 2. Governance and Management — 15%

1. `gov_01` — Management roles, responsibilities and decision-making authority are
   clearly defined.
2. `gov_02` — Important business decisions and approvals are documented.
3. `gov_03` — The enterprise maintains effective financial and operational controls.
4. `gov_04` — Management has adequate technical and commercial capability to run the
   enterprise.

## 3. Market Strength — 20%

1. `mkt_01` — The enterprise has credible, documented buyer or off-taker relationships.
2. `mkt_02` — The enterprise has a track record of honouring contractual or supply
   commitments.
3. `mkt_03` — Contracts or market arrangements provide reasonably predictable demand and
   pricing.
4. `mkt_04` — The enterprise can consistently meet agreed quantity and quality
   requirements.

## 4. Operational Capacity — 15%

1. `ops_01` — The enterprise has secure and documented access to the land, facilities or
   premises it operates from.
2. `ops_02` — Production or operational infrastructure is adequate and reliably
   maintained.
3. `ops_03` — The enterprise can consistently meet its planned production or service
   volumes.
4. `ops_04` — The enterprise has access to the inputs, labour and technical support it
   needs to operate.

## 5. Climate Resilience — 15%

1. `cli_01` — The enterprise has identified the key climate and weather-related risks to
   its operations.
2. `cli_02` — The enterprise has taken practical steps to reduce exposure to drought,
   flooding or extreme weather.
3. `cli_03` — The enterprise has access to water, energy or inputs that remain reliable
   under climate stress.
4. `cli_04` — The enterprise holds, or is actively pursuing, insurance or another formal
   risk-transfer mechanism.

## 6. Digital Readiness — 10%

1. `dig_01` — Important business transactions are digitally recorded.
2. `dig_02` — The enterprise can produce a reliable digital transaction history on
   request.
3. `dig_03` — The enterprise uses digital payment or mobile money channels for business
   transactions.
4. `dig_04` — Digital records are available and could be shared with a financier or
   investor if requested.

## Readiness bands

| Band code | Score range | Label |
|---|---|---|
| `investment_ready` | 80–100 | Investment Ready |
| `finance_ready_conditions` | 65–79 | Finance Ready with Conditions |
| `developing_bankability` | 50–64 | Developing Bankability |
| `early_stage_readiness` | 35–49 | Early-Stage Readiness |
| `pre_bankable` | 0–34 | Pre-Bankable |

## Critical gates, evidence levels, recommendations and financing pathways

These sit alongside — not inside — the weighted score. See:
- `11_CRITICAL_GATES.md` for the five gates and evidence levels
- `12_RECOMMENDATION_ENGINE.md` for gap → recommendation mapping
- `13_FINANCING_PATHWAYS.md` for the nine financing instruments
- `10_SCORING_ENGINE.md` for how it all combines into the ABI score
