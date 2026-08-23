"""
PDF (ReportLab) and CSV report generation per docs/16_REPORTING_SPECIFICATION.md.
Column/section content is always read from the assessment's own persisted
results (never recomputed, never a hardcoded framework value) -- see
apps.assessments.results.build_results_payload for the shared source of truth.
"""

import csv
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from config.disclaimers import RESEARCH_PROTOTYPE_DISCLAIMER

from apps.assessments.results import build_results_payload
from apps.frameworks.models import Question


def generate_pdf_report(assessment) -> bytes:
    payload = build_results_payload(assessment)
    styles = getSampleStyleSheet()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm, leftMargin=18 * mm, rightMargin=18 * mm
    )
    story = [
        Paragraph("AGRIBUSINESS BANKABILITY INDEX", styles["Title"]),
        Paragraph("ABI DEMO -- VERSION 0.1", styles["Heading3"]),
        Spacer(1, 6),
        Paragraph(f"Enterprise: {assessment.enterprise.name}", styles["Normal"]),
        Paragraph(
            f"Assessment date: {assessment.submitted_at.date() if assessment.submitted_at else '-'}",
            styles["Normal"],
        ),
        Spacer(1, 10),
        Paragraph("ABI SCORE", styles["Heading2"]),
        Paragraph(f"{payload['abi_score']:.0f} / 100", styles["Normal"]),
        Paragraph("READINESS", styles["Heading2"]),
        Paragraph(payload["readiness_band"]["label"], styles["Normal"]),
        Spacer(1, 10),
        Paragraph("DIMENSION PROFILE", styles["Heading2"]),
    ]

    dim_table_data = [["Dimension", "Score", "Weight"]] + [
        [d["dimension"], f"{d['score']:.0f}", f"{d['weight_percent']:.0f}%"]
        for d in payload["dimension_scores"]
    ]
    dim_table = Table(dim_table_data, hAlign="LEFT")
    dim_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0E3B2E")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.append(dim_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Strengths", styles["Heading3"]))
    story.append(Paragraph(", ".join(payload["strengths"]) or "-", styles["Normal"]))
    story.append(Paragraph("Priority gaps", styles["Heading3"]))
    story.append(Paragraph(", ".join(payload["priority_gaps"]) or "-", styles["Normal"]))

    story.append(Paragraph("Critical gates", styles["Heading3"]))
    for gate in payload["critical_gates"]:
        story.append(Paragraph(f"{gate['name']}: {gate['result']}", styles["Normal"]))

    story.append(Paragraph("Recommended actions", styles["Heading3"]))
    for rec in payload["recommendations"][:6]:
        story.append(Paragraph(f"- {rec['text']}", styles["Normal"]))

    story.append(Paragraph("Potential financing pathways", styles["Heading3"]))
    for pathway in payload["financing_pathways"][:5]:
        story.append(Paragraph(f"- {pathway['name']}: {pathway['description']}", styles["Normal"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Research disclaimer", styles["Heading3"]))
    story.append(Paragraph(RESEARCH_PROTOTYPE_DISCLAIMER, styles["Normal"]))

    doc.build(story)
    return buffer.getvalue()


def _csv_headers(assessment):
    fv = assessment.framework_version
    questions = list(
        Question.objects.filter(dimension__framework_version=fv)
        .select_related("dimension")
        .order_by("dimension__display_order", "display_order")
    )
    dimensions = list(fv.dimensions.all().order_by("display_order"))
    gates = list(fv.critical_gates.all().order_by("display_order"))

    headers = [
        "enterprise_name",
        "enterprise_code",
        "value_chain",
        "province",
        "organisation_type",
        "turnover_band",
        "framework_version",
    ]
    headers += [q.code for q in questions]
    headers += [f"{d.code}_score" for d in dimensions]
    headers += ["abi_total_score", "readiness_band_code"]
    headers += [f"{g.code}_result" for g in gates]
    headers += ["evidence_coverage_percent"]
    return headers, questions, dimensions, gates


def generate_csv_report(assessment) -> str:
    headers, questions, dimensions, gates = _csv_headers(assessment)

    responses_by_question = {r.question_id: r for r in assessment.responses.all()}
    dim_scores_by_dimension = {ds.dimension_id: ds for ds in assessment.dimension_scores.all()}
    gate_results_by_gate = {gr.gate_id: gr for gr in assessment.gate_results.all()}
    abi_score = getattr(assessment, "abi_score", None)
    enterprise = assessment.enterprise

    row = {
        "enterprise_name": enterprise.name,
        "enterprise_code": enterprise.code,
        "value_chain": enterprise.value_chain,
        "province": enterprise.province,
        "organisation_type": enterprise.organisation_type,
        "turnover_band": enterprise.turnover_band,
        "framework_version": assessment.framework_version.version_label,
    }
    for q in questions:
        response = responses_by_question.get(q.id)
        row[q.code] = response.score_value if response else ""
    for d in dimensions:
        ds = dim_scores_by_dimension.get(d.id)
        row[f"{d.code}_score"] = float(ds.raw_average) if ds else ""
    row["abi_total_score"] = float(abi_score.total_score) if abi_score else ""
    row["readiness_band_code"] = abi_score.readiness_band_code if abi_score else ""
    for g in gates:
        gr = gate_results_by_gate.get(g.id)
        row[f"{g.code}_result"] = gr.result if gr else ""
    row["evidence_coverage_percent"] = (
        float(abi_score.evidence_coverage_percent) if abi_score else ""
    )

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    writer.writerow(row)
    return buffer.getvalue()
