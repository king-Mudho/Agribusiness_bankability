# AGENTS.md — Master execution instructions

You are building **ABI (Agribusiness Bankability Index) — Demo Version 0.1**, a research
demonstration prototype for the project *"Developing and Validating the Agribusiness
Bankability Framework for Food Systems Transformation through Novel Financing Models in
Zimbabwe."* Sponsor for the live demonstration: **GigaFood Africa**.

This file is the entry point. Read it fully before writing any code.

## 0. Non-negotiable ground rules

1. **Two top-level folders only**: `frontend/` and `backend/`. No `mobile/`, no separate
   `api/` or `admin/` repos. See `docs/03_SYSTEM_ARCHITECTURE.md`.
2. **This is a research prototype, not a production lending system.** Never use the words
   "approved", "loan approval", "credit rating", or "guarantee" anywhere in UI copy, API
   responses, or docs. Use "indicative", "provisional", "potential financing pathway",
   "research prototype". See `docs/18_DATA_PRIVACY.md` and `docs/13_FINANCING_PATHWAYS.md`.
3. **The backend is the sole source of truth for the ABI score.** The frontend may render
   scores but must never independently calculate the authoritative score. See
   `docs/10_SCORING_ENGINE.md`.
4. **The scoring methodology is versioned.** Dimensions, questions, weights, thresholds,
   critical gates and recommendation logic live in the database as `FrameworkVersion` data,
   not hardcoded in application code. Do not hardcode weights in React or Django views. See
   `docs/09_ABI_FRAMEWORK.md` and `docs/05_DATABASE_ARCHITECTURE.md`.
5. **Do not invent or alter the ABI methodology.** The six dimensions, their weights, the
   24 questions, the five critical gates, the five readiness bands and the financing
   pathway list in `docs/09_ABI_FRAMEWORK.md`, `docs/11_CRITICAL_GATES.md` and
   `docs/13_FINANCING_PATHWAYS.md` are fixed for v0.1. If something looks incomplete or
   ambiguous, flag it in your progress notes — do not silently substitute your own
   framework.
6. **Do not build what section "Out of scope" in `docs/02_PRODUCT_REQUIREMENTS.md`
   excludes** (no real loan approval, no credit bureau integration, no live banking
   integration, no payment processing, no ML credit scoring, no blockchain, no complex
   underwriting, no native mobile apps). Keep v0.1 lean.
7. **Every screen and export must carry the research disclaimer** defined in
   `docs/18_DATA_PRIVACY.md`.
8. **Domain**: `agribusinessbankability.com` — always read from environment configuration,
   never hardcoded. See `docs/21_ENVIRONMENT_CONFIGURATION.md`.

## 1. Reading order

Read every file in `docs/` in this order before starting implementation. Each file is
short enough to read in full.

```
INDEX.md
00_PROJECT_MASTER.md
01_RESEARCH_CONTEXT.md
02_PRODUCT_REQUIREMENTS.md
03_SYSTEM_ARCHITECTURE.md
04_TECH_STACK.md
05_DATABASE_ARCHITECTURE.md
06_API_ARCHITECTURE.md
07_FRONTEND_ARCHITECTURE.md
08_BACKEND_ARCHITECTURE.md
09_ABI_FRAMEWORK.md
10_SCORING_ENGINE.md
11_CRITICAL_GATES.md
12_RECOMMENDATION_ENGINE.md
13_FINANCING_PATHWAYS.md
14_ASSESSMENT_WORKFLOW.md
15_DASHBOARD_SPECIFICATION.md
16_REPORTING_SPECIFICATION.md
17_RESEARCH_VALIDATION.md
18_DATA_PRIVACY.md
19_TESTING_STRATEGY.md
20_DEPLOYMENT_ARCHITECTURE.md
21_ENVIRONMENT_CONFIGURATION.md
22_DEMO_SCRIPT.md
23_UI_UX_GUIDELINES.md
24_SEED_DATA.md
25_AGENT_EXECUTION_PLAN.md
26_DEFINITION_OF_DONE.md
```

Then execute `25_AGENT_EXECUTION_PLAN.md` phase by phase, in order. Do not skip ahead to
frontend work before the backend scoring engine in Phase 3 is implemented and tested —
the frontend wizard needs a real API to call.

## 2. How to track progress

- `25_AGENT_EXECUTION_PLAN.md` contains checkbox tasks (`- [ ] ...`) grouped into phases.
  As you complete each task, edit that file in place and change `[ ]` to `[x]`. Do not
  delete or renumber tasks.
- Before declaring the build finished, verify every criterion in
  `26_DEFINITION_OF_DONE.md`. Do not claim completion if any item is unchecked.
- Commit after each phase with a message in the form `phase(N): <short summary>`.

## 3. If something is missing or ambiguous

Stop and write a note at the top of `25_AGENT_EXECUTION_PLAN.md` under a `## Open
questions` heading, describing exactly what is missing and what assumption you are
making to proceed. Never silently guess at scoring weights, gate definitions or
financing-pathway wording — those must match the docs exactly.

## 4. Definition of done

See `docs/26_DEFINITION_OF_DONE.md`. The build is not complete until every item there is
checked and the demo script in `docs/22_DEMO_SCRIPT.md` can be run end to end on a fresh
checkout.
