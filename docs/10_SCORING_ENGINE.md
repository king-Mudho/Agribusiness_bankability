# 10 — Scoring engine

Lives in `backend/apps/scoring/`. Pure function: `(framework_definition, responses) →
(dimension_scores, abi_score)`. Called once on `POST /assessments/{id}/submit/`, result
persisted to `DimensionScore` and `ABIScore` (see `05_DATABASE_ARCHITECTURE.md`). The
frontend never recomputes this — it only displays what this engine returns.

## Step 1 — map each response to a score

```
1 → 0
2 → 25
3 → 50
4 → 75
5 → 100
```

(Read from `ResponseOption.score_value`, not hardcoded — see `09_ABI_FRAMEWORK.md`.)

## Step 2 — dimension average

For each dimension, average the score_value of its (four) answered questions.

## Step 3 — apply the provisional dimension weight

`weighted_contribution = dimension_average * weight_percent / 100`

## Step 4 — sum to the overall ABI

`abi_score = round(sum(weighted_contribution for all dimensions))`

## Worked example

```
Financial Performance    60 × 25% = 15.00
Governance & Management  70 × 15% = 10.50
Market Strength          75 × 20% = 15.00
Operational Capacity     65 × 15% =  9.75
Climate Resilience       50 × 15% =  7.50
Digital Readiness        40 × 10% =  4.00
                                   --------
ABI                                 61.75  →  displayed as 62 / 100
```

This example (final score **62**, band **Developing Bankability**) must appear as an
exact-value unit test — see `19_TESTING_STRATEGY.md`.

## Pseudocode

```python
def compute_abi(framework: FrameworkDefinition, responses: list[Response]) -> ABIResult:
    dimension_scores = []
    for dimension in framework.dimensions:
        dim_responses = [r for r in responses if r.question.dimension_id == dimension.id]
        if not dim_responses:
            raise IncompleteAssessmentError(dimension.code)
        raw_average = sum(r.score_value for r in dim_responses) / len(dim_responses)
        weighted = raw_average * dimension.weight_percent / 100
        dimension_scores.append(
            DimensionScoreResult(dimension=dimension, raw_average=raw_average, weighted=weighted)
        )

    total = round(sum(d.weighted for d in dimension_scores))
    band = resolve_readiness_band(total, framework.readiness_bands)

    return ABIResult(
        total_score=total,
        dimension_scores=dimension_scores,
        readiness_band=band,
    )
```

## Completeness rule

For v0.1, **require all 24 questions answered** before `submit` is accepted — return a
`400` with the list of missing question codes otherwise. Do not compute a partial score
silently; an incomplete-but-scored assessment would misrepresent the research data.

## Evidence-adjusted score (v0.1 behaviour)

Do **not** let evidence levels change the core ABI calculation in v0.1 — that requires
research-methodology sign-off first. Instead compute and display separately:

```
evidence_coverage_percent = (questions with evidence_level >= 2) / 24 * 100
```

Shown alongside the score, e.g. "ABI: 62/100 · Evidence coverage: 54%".

## Versioning

- Every `Assessment` references a specific `FrameworkVersion`; the scoring function
  always reads dimensions/weights/questions from that version, never a "current" global.
- If the scoring calculation logic itself changes (not just the data), bump
  `ABIScore.scoring_engine_version` so historical results stay traceable to the code that
  produced them.
- One enterprise may have multiple `Assessment` rows across different
  `FrameworkVersion`s — never overwrite an earlier assessment's stored result.
