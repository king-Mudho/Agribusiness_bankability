# 05 — Database architecture

PostgreSQL. Each table below maps to one Django model (app shown in brackets). Use
Django's default `id` (BigAutoField) primary keys unless noted. All `created_at` /
`updated_at` timestamp pairs are implied on every model even where not listed.

## Entity list

```
User, Role                                    (accounts)
Enterprise, EnterpriseProfile                 (enterprises)
FrameworkVersion, Dimension, Question,
  ResponseOption, CriticalGateDefinition       (frameworks)
Assessment, AssessmentResponse,
  CriticalGateResult                           (assessments)
EvidenceRecord                                 (evidence)
DimensionScore, ABIScore                       (scoring)
Recommendation, AssessmentRecommendation       (recommendations)
FinancingPathwayDefinition,
  AssessmentFinancingPathway                   (financing)
Report                                         (reports)
PilotFeedback                                  (feedback)
ExpertReview, CognitivePretestNote             (research)
AuditLog                                       (audit)
```

## accounts

### User
Extend Django's `AbstractUser`.
| Field | Type | Notes |
|---|---|---|
| role | FK → Role | |
| phone | CharField, optional | |

### Role
| Field | Type | Notes |
|---|---|---|
| name | CharField, unique | ADMIN, RESEARCHER, DATA_COLLECTOR, ANALYST, VIEWER |

## enterprises

### Enterprise
| Field | Type | Notes |
|---|---|---|
| name | CharField | Firm / organisation name |
| code | CharField, unique | Internal enterprise code |
| anonymous_respondent_code | CharField, unique | Used on public/aggregate views instead of `name` |
| organisation_type | CharField (choices) | e.g. Sole trader, Partnership, Cooperative, Company |
| value_chain | CharField (choices) | e.g. Poultry, Horticulture, Grain, Livestock, Dairy |
| province | CharField (choices) | Zimbabwe provinces |
| district | CharField | |
| years_operating | PositiveIntegerField | |
| workers_count | PositiveIntegerField | |
| turnover_band | CharField (choices) | Banded, not exact figures |
| created_by | FK → User | |

### EnterpriseProfile
One-to-one with `Enterprise`, captured during the assessment intake step.
| Field | Type | Notes |
|---|---|---|
| enterprise | OneToOne → Enterprise | |
| finance_required_amount | DecimalField | |
| finance_required_currency | CharField | Default USD |
| finance_type_sought | CharField (choices) | Working capital, Asset finance, etc. |
| intended_use | TextField | |
| previous_borrowing | BooleanField | |
| previous_borrowing_notes | TextField, optional | |
| preferred_financier_type | CharField (choices) | Bank, MFI, Investor, Development finance, Other |
| consent_given | BooleanField | |
| consent_timestamp | DateTimeField | |

## frameworks

### FrameworkVersion
| Field | Type | Notes |
|---|---|---|
| version_label | CharField, unique | e.g. "0.1" |
| status | CharField (choices) | DRAFT, ACTIVE, ARCHIVED |
| effective_from | DateTimeField | |
| notes | TextField | Versioning rationale |

### Dimension
| Field | Type | Notes |
|---|---|---|
| framework_version | FK → FrameworkVersion | |
| code | CharField | e.g. `financial_performance` |
| name | CharField | e.g. "Financial Performance" |
| weight_percent | DecimalField | Must sum to 100 across a version's dimensions |
| display_order | PositiveIntegerField | |

### Question
| Field | Type | Notes |
|---|---|---|
| dimension | FK → Dimension | |
| code | CharField | e.g. `fin_01` |
| prompt | TextField | |
| display_order | PositiveIntegerField | |

### ResponseOption
| Field | Type | Notes |
|---|---|---|
| question | FK → Question (nullable — options are usually shared per framework version, see note) | |
| scale_value | PositiveSmallIntegerField | 1–5 |
| label | CharField | e.g. "To a large extent" |
| score_value | PositiveSmallIntegerField | 0, 25, 50, 75, 100 |

*Note*: the five-point scale and score mapping is identical for every question in v0.1
(see `09_ABI_FRAMEWORK.md`), so `ResponseOption` rows may be seeded once per
`FrameworkVersion` and referenced by `scale_value`, or duplicated per question — either
is acceptable as long as the mapping is DB-driven, not hardcoded in Python/TS.

### CriticalGateDefinition
| Field | Type | Notes |
|---|---|---|
| framework_version | FK → FrameworkVersion | |
| code | CharField | e.g. `legal_identity` |
| name | CharField | |
| description | TextField | |
| display_order | PositiveIntegerField | |

## assessments

### Assessment
| Field | Type | Notes |
|---|---|---|
| enterprise | FK → Enterprise | |
| framework_version | FK → FrameworkVersion | |
| status | CharField (choices) | DRAFT, SUBMITTED, SCORED |
| started_at | DateTimeField | |
| submitted_at | DateTimeField, nullable | |
| completion_seconds | PositiveIntegerField, nullable | For the 10–12 min research target |
| collected_by | FK → User, nullable | Internal data collector, if applicable |
| offline_created | BooleanField | True if drafted offline then synced |

### AssessmentResponse
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment | |
| question | FK → Question | |
| scale_value | PositiveSmallIntegerField | 1–5 |
| score_value | PositiveSmallIntegerField | Denormalised copy of the mapped score at time of answer |

### CriticalGateResult
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment | |
| gate | FK → CriticalGateDefinition | |
| result | CharField (choices) | PASS, CAUTION, NOT_MET |
| note | TextField, optional | |

## evidence

### EvidenceRecord
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment | |
| question | FK → Question, nullable | Null = dimension-level evidence |
| dimension | FK → Dimension, nullable | |
| evidence_level | PositiveSmallIntegerField | 0–4, see `10_SCORING_ENGINE.md` |
| description | TextField, optional | |

## scoring

### DimensionScore
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment | |
| dimension | FK → Dimension | |
| raw_average | DecimalField | Mean of the dimension's question scores (0–100) |
| weighted_contribution | DecimalField | `raw_average * weight_percent / 100` |

### ABIScore
| Field | Type | Notes |
|---|---|---|
| assessment | OneToOne → Assessment | |
| total_score | DecimalField | 0–100 |
| readiness_band_code | CharField | See `09_ABI_FRAMEWORK.md` bands |
| evidence_coverage_percent | DecimalField | Share of questions with evidence_level ≥ 2 |
| computed_at | DateTimeField | |
| scoring_engine_version | CharField | Traceability if the calculation code itself changes |

## recommendations

### Recommendation
| Field | Type | Notes |
|---|---|---|
| framework_version | FK → FrameworkVersion | |
| dimension | FK → Dimension | |
| text | TextField | |
| display_order | PositiveIntegerField | |

### AssessmentRecommendation
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment | |
| recommendation | FK → Recommendation | |
| priority_rank | PositiveIntegerField | Lower = higher priority |

## financing

### FinancingPathwayDefinition
| Field | Type | Notes |
|---|---|---|
| framework_version | FK → FrameworkVersion | |
| code | CharField | e.g. `warehouse_receipt_finance` |
| name | CharField | |
| description | TextField | |
| suited_bands | ArrayField(CharField) or M2M | Readiness band codes it suits |

### AssessmentFinancingPathway
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment | |
| pathway | FK → FinancingPathwayDefinition | |
| relevance_rank | PositiveIntegerField | |

## reports

### Report
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment | |
| report_type | CharField (choices) | PDF, CSV |
| file | FileField | Generated artefact |
| generated_at | DateTimeField | |

## feedback

### PilotFeedback
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment | |
| score_reflects_enterprise | BooleanField, nullable | |
| most_relevant_dimension | FK → Dimension, nullable | |
| unclear_question | FK → Question, nullable | |
| missing_factor_notes | TextField, optional | |
| would_help_prepare_for_finance | BooleanField, nullable | |
| willing_to_provide_evidence_later | BooleanField, nullable | |
| perceived_duration_minutes | PositiveIntegerField, nullable | |
| would_recommend | BooleanField, nullable | |

## research

### ExpertReview
| Field | Type | Notes |
|---|---|---|
| framework_version | FK → FrameworkVersion | |
| reviewer_name | CharField | |
| reviewer_affiliation | CharField, optional | |
| comments | TextField | |
| suggested_weight_changes | JSONField, optional | |
| created_at | DateTimeField | |

### CognitivePretestNote
| Field | Type | Notes |
|---|---|---|
| assessment | FK → Assessment, nullable | |
| observer_name | CharField | |
| question | FK → Question, nullable | |
| observation | TextField | |
| perceived_usefulness_rating | PositiveSmallIntegerField, nullable | |

## audit

### AuditLog
| Field | Type | Notes |
|---|---|---|
| user | FK → User, nullable | |
| action | CharField | e.g. `assessment.submitted`, `report.generated` |
| object_type | CharField | |
| object_id | CharField | |
| metadata | JSONField, optional | |
| created_at | DateTimeField | |

## Integrity rules

- A `FrameworkVersion`'s `Dimension.weight_percent` values must sum to 100 — enforce with
  a model `clean()`/serializer validation, not just a DB constraint comment.
- `AssessmentResponse.score_value` and `DimensionScore` / `ABIScore` are **computed and
  written by the backend only**, never accepted as client input.
- `Enterprise.name` must never appear in any aggregate/public dashboard payload — use
  `anonymous_respondent_code` there (see `18_DATA_PRIVACY.md`).
