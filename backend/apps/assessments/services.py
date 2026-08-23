from django.db import transaction
from django.utils import timezone

from apps.evidence.models import EvidenceRecord
from apps.frameworks.models import CriticalGateDefinition, Dimension, Question, ResponseOption

from .models import Assessment, AssessmentResponse, CriticalGateResult


class UnknownCodeError(Exception):
    def __init__(self, kind: str, codes: list[str]):
        self.kind = kind
        self.codes = codes
        super().__init__(f"Unknown {kind} code(s): {', '.join(codes)}")


def _resolve_score_value(framework_version, question, scale_value):
    option = question.options.filter(scale_value=scale_value).first()
    if option is None:
        option = framework_version.shared_response_options.filter(
            scale_value=scale_value
        ).first()
    if option is None:
        raise UnknownCodeError("scale_value", [str(scale_value)])
    return option.score_value


@transaction.atomic
def upsert_responses(assessment: Assessment, items: list[dict]) -> list[AssessmentResponse]:
    questions_by_code = {
        q.code: q
        for q in Question.objects.filter(
            dimension__framework_version=assessment.framework_version
        )
    }
    unknown = [item["question_code"] for item in items if item["question_code"] not in questions_by_code]
    if unknown:
        raise UnknownCodeError("question", unknown)

    saved = []
    for item in items:
        question = questions_by_code[item["question_code"]]
        scale_value = item["scale_value"]
        score_value = _resolve_score_value(assessment.framework_version, question, scale_value)
        response, _created = AssessmentResponse.objects.update_or_create(
            assessment=assessment,
            question=question,
            defaults={"scale_value": scale_value, "score_value": score_value},
        )
        saved.append(response)
    return saved


@transaction.atomic
def upsert_gates(assessment: Assessment, items: list[dict]) -> list[CriticalGateResult]:
    gates_by_code = {
        g.code: g
        for g in CriticalGateDefinition.objects.filter(
            framework_version=assessment.framework_version
        )
    }
    unknown = [item["gate_code"] for item in items if item["gate_code"] not in gates_by_code]
    if unknown:
        raise UnknownCodeError("gate", unknown)

    from apps.audit.utils import log_action

    saved = []
    for item in items:
        gate = gates_by_code[item["gate_code"]]
        result, _created = CriticalGateResult.objects.update_or_create(
            assessment=assessment,
            gate=gate,
            defaults={"result": item["result"], "note": item.get("note", "")},
        )
        saved.append(result)
        log_action(
            "assessment.gate_recorded",
            assessment,
            {"gate": gate.code, "result": item["result"]},
        )
    return saved


@transaction.atomic
def upsert_evidence(assessment: Assessment, items: list[dict]) -> list[EvidenceRecord]:
    fv = assessment.framework_version
    questions_by_code = {q.code: q for q in Question.objects.filter(dimension__framework_version=fv)}
    dimensions_by_code = {d.code: d for d in Dimension.objects.filter(framework_version=fv)}

    unknown_questions = [
        item["question_code"]
        for item in items
        if item.get("question_code") and item["question_code"] not in questions_by_code
    ]
    unknown_dimensions = [
        item["dimension_code"]
        for item in items
        if item.get("dimension_code") and item["dimension_code"] not in dimensions_by_code
    ]
    if unknown_questions:
        raise UnknownCodeError("question", unknown_questions)
    if unknown_dimensions:
        raise UnknownCodeError("dimension", unknown_dimensions)

    saved = []
    for item in items:
        question = questions_by_code.get(item.get("question_code"))
        dimension = dimensions_by_code.get(item.get("dimension_code"))
        lookup = {"assessment": assessment, "question": question, "dimension": dimension}
        record, _created = EvidenceRecord.objects.update_or_create(
            **lookup,
            defaults={
                "evidence_level": item["evidence_level"],
                "description": item.get("description", ""),
            },
        )
        saved.append(record)
    return saved


def submit_assessment(assessment: Assessment):
    """Finalises an assessment: marks SUBMITTED (recording completion_seconds),
    then runs the scoring engine, which marks it SCORED. Propagates
    IncompleteAssessmentError untouched -- the view maps that to HTTP 400.
    """
    from apps.scoring.services import score_assessment  # avoid app-loading cycle

    now = timezone.now()
    assessment.submitted_at = now
    assessment.completion_seconds = int((now - assessment.started_at).total_seconds())
    assessment.status = Assessment.Status.SUBMITTED
    assessment.save(update_fields=["submitted_at", "completion_seconds", "status"])

    from apps.audit.utils import log_action

    abi_score = score_assessment(assessment)
    log_action("assessment.submitted", assessment, {"total_score": str(abi_score.total_score)})
    return abi_score


def create_demo_assessment(enterprise_code: str) -> Assessment:
    """"Load Demo Firm": clones the seeded template assessment's responses,
    gate results and evidence for the given demo enterprise into a brand new
    Assessment, then scores it -- per docs/24_SEED_DATA.md.
    """
    from apps.scoring.services import score_assessment

    template = (
        Assessment.objects.filter(enterprise__code=enterprise_code)
        .select_related("enterprise", "framework_version")
        .order_by("-started_at")
        .first()
    )
    if template is None:
        raise Assessment.DoesNotExist(f"No template assessment for enterprise {enterprise_code}")

    with transaction.atomic():
        new_assessment = Assessment.objects.create(
            enterprise=template.enterprise,
            framework_version=template.framework_version,
            offline_created=False,
        )
        for response in template.responses.all():
            AssessmentResponse.objects.create(
                assessment=new_assessment,
                question=response.question,
                scale_value=response.scale_value,
                score_value=response.score_value,
            )
        for gate_result in template.gate_results.all():
            CriticalGateResult.objects.create(
                assessment=new_assessment,
                gate=gate_result.gate,
                result=gate_result.result,
                note=gate_result.note,
            )
        for evidence in template.evidence_records.all():
            EvidenceRecord.objects.create(
                assessment=new_assessment,
                question=evidence.question,
                dimension=evidence.dimension,
                evidence_level=evidence.evidence_level,
                description=evidence.description,
            )
        new_assessment.submitted_at = timezone.now()
        new_assessment.completion_seconds = 0
        new_assessment.status = Assessment.Status.SUBMITTED
        new_assessment.save(update_fields=["submitted_at", "completion_seconds", "status"])
        score_assessment(new_assessment)

    return new_assessment
