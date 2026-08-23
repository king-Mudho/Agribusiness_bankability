# 00 — Project master

## Project identity

- **Product name**: Agribusiness Bankability Index (ABI)
- **Build label**: ABI Demo — Version 0.1 (research prototype)
- **Research programme**: *Developing and Validating the Agribusiness Bankability
  Framework for Food Systems Transformation through Novel Financing Models in Zimbabwe*
- **Domain**: `agribusinessbankability.com`
- **Repository name**: `agribusiness-bankability`

## Purpose

ABI is a self-assessment and diagnostic tool that gives an agribusiness enterprise an
indicative "financing readiness" score (0–100), a breakdown across six dimensions,
identification of critical bankability gates, tailored improvement recommendations, and
potential (not approved) financing pathways. It exists to demonstrate — and pilot-test —
a bankability framework, not to make lending decisions.

## Stakeholders

| Role | Name / entity | Notes |
|------|----------------|-------|
| Sponsor | GigaFood Africa | Demonstration sponsor at the Agricultural Show |
| Strategic partner | Proagromark Consultancy Company | Consultancy partner |
| Demo contact | Happyson Saina | Call/WhatsApp +263 773 943 709 · sales.proagromark2@gmail.com · consult.proagromark2@gmail.com |
| Participating demo enterprises | Maundurahuku, Zvemuchando | Used for seeded demo data — see `24_SEED_DATA.md` |
| Target audience | Farmers, agribusiness firms, farmer organisations, aggregators, banks, investors, insurers, government agencies, development partners, technology providers | See `22_DEMO_SCRIPT.md` |

## Scope for Version 0.1

**In scope**: enterprise profile capture, 24-question guided assessment across six
dimensions, five critical bankability gates, evidence-level capture, versioned scoring
engine, results screen, executive/research dashboard (individual + aggregate views),
one-page PDF report, CSV export, pilot feedback capture, research validation capture,
offline-capable responsive web app, role-based access for internal users.

**Out of scope**: see `02_PRODUCT_REQUIREMENTS.md` § Out of scope. In short — no real
loan decisioning, no banking/credit-bureau integrations, no ML scoring, no blockchain,
no native mobile apps.

## Repository layout

Exactly two top-level application folders, plus root-level docs and config:

```
agribusiness-bankability/
├── AGENTS.md
├── README.md
├── docs/
├── frontend/
└── backend/
```

## Glossary

| Term | Meaning |
|------|---------|
| ABI | Agribusiness Bankability Index — the 0–100 composite score |
| ABF-FST | Agribusiness Bankability Framework for Food Systems Transformation — the underlying research framework being validated |
| Dimension | One of the six scored categories (e.g. Financial Performance) |
| Readiness band | One of five labels applied to an ABI score range (e.g. "Developing Bankability") |
| Critical gate | One of five pass/caution/not-met checks that sit outside the weighted score |
| Evidence level | 0–4 rating of how well a response is substantiated by documentation |
| Framework version | A versioned, database-stored snapshot of dimensions, questions, weights and thresholds |
| Financing pathway | A *potential*, non-binding suggestion of a finance instrument that may fit the enterprise's profile |

## Framework versioning note

An earlier, informal prototype (screenshots supplied as visual reference only) used a
different six-dimension layout: *Governance & Risk, Contractual Credibility, Cash-Flow
Predictability, Financial Discipline, Digital Traceability, Aggregation Capability* (5
questions each, equally weighted). That layout is **superseded**. Treat it as
`FrameworkVersion 0.0 (reference only)` — do not build against it. The canonical
methodology to implement is defined in `09_ABI_FRAMEWORK.md` (`FrameworkVersion 0.1`).
See `01_RESEARCH_CONTEXT.md` for the full explanation.
