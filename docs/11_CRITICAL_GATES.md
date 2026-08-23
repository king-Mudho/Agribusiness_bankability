# 11 — Critical bankability gates & evidence levels

Critical gates sit **outside** the weighted ABI score. They exist so that an enterprise
can score reasonably well overall while still having a fundamental issue a financier
would need to know about. **A gate failure never auto-rejects or deletes an
assessment** — it is surfaced as a flag with an explanation.

## The five gates (`FrameworkVersion 0.1`)

| Code | Name | What it checks |
|---|---|---|
| `legal_identity` | Legal identity | Is the enterprise a legally identifiable entity (registered business, cooperative, or verifiable sole trader) with traceable ownership? |
| `financial_records` | Financial records | Does the enterprise have any financial records — even informal ones — that a financier could review? |
| `source_of_repayment` | Source of repayment | Is there an identifiable, plausible source of income or revenue from which financing could be repaid? |
| `market_revenue_opportunity` | Market / revenue opportunity | Is there evidence of an actual market or revenue opportunity (real buyers, demonstrated demand) rather than a purely speculative concept? |
| `fraud_default_concerns` | Fraud / serious default concerns | Are there no known indicators of fraud, serious credit default, or integrity concerns? |

## Gate result values

Each gate is answered `PASS`, `CAUTION`, or `NOT_MET`, with an optional free-text note
(`CriticalGateResult.note`).

## Overall gate status logic

```
if all gates == PASS:            overall = "Ready"
elif any gate == NOT_MET:        overall = "Not currently bankable"
elif any gate == CAUTION:        overall = "Further preparation required"
```

Display example, matching the reference prototype's pattern:

```
ABI Score: 74
Critical Gate Status: ⚠ Further preparation required
  → Source of repayment: Caution — seasonal income only, no off-season buffer identified.
```

## Evidence levels

Independent of the gates, each question (or dimension, if captured at that grain) can
carry an evidence level:

| Level | Meaning |
|---|---|
| 0 | No evidence available |
| 1 | Verbal explanation only |
| 2 | Internal record available |
| 3 | Formal document available |
| 4 | Independently verified evidence |

Evidence levels feed `evidence_coverage_percent` (see `10_SCORING_ENGINE.md`) and are
shown to distinguish **self-reported ABI** from a future **evidence-adjusted ABI** — the
latter is out of scope for v0.1's scoring calculation, but the UI should make clear this
distinction exists and is being piloted.

## UI requirement

Both the gate step and the evidence capture are distinct wizard steps (see
`14_ASSESSMENT_WORKFLOW.md`), not folded into the six dimension screens, so respondents
clearly understand these are different kinds of question.
