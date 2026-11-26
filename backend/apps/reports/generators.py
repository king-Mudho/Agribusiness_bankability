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
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from config.disclaimers import RESEARCH_PROTOTYPE_DISCLAIMER

from apps.assessments.results import build_results_payload
from apps.frameworks.models import Question


def _compact_styles():
    """A dense stylesheet -- docs/16_REPORTING_SPECIFICATION.md requires the
    whole report fit a single page, and ReportLab's default Heading/Normal
    styles are far too spacious for that once every section is included.
    """
    base = getSampleStyleSheet()
    styles = {
        "Title": ParagraphStyle("CompactTitle", parent=base["Title"], fontSize=15, leading=17, spaceAfter=2),
        "Section": ParagraphStyle(
            "CompactSection",
            parent=base["Heading3"],
            fontSize=10,
            leading=12,
            spaceBefore=6,
            spaceAfter=2,
            textColor=colors.HexColor("#0E3B2E"),
        ),
        "Body": ParagraphStyle("CompactBody", parent=base["Normal"], fontSize=8.5, leading=11),
    }
    return styles


def generate_pdf_report(assessment) -> bytes:
    payload = build_results_payload(assessment)
    styles = _compact_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4, topMargin=14 * mm, bottomMargin=14 * mm, leftMargin=16 * mm, rightMargin=16 * mm
    )
    story = [
        Paragraph("AGRIBUSINESS BANKABILITY INDEX -- ABI DEMO v0.1", styles["Title"]),
        Paragraph(
            f"Enterprise: {assessment.enterprise.name} | "
            f"Assessment date: {assessment.submitted_at.date() if assessment.submitted_at else '-'} | "
            f"ABI SCORE: {payload['abi_score']:.0f}/100 | "
            f"READINESS: {payload['readiness_band']['label']}",
            styles["Body"],
        ),
    ]

    story.append(Paragraph("Dimension profile", styles["Section"]))
    dim_table_data = [["Dimension", "Score", "Weight"]] + [
        [d["dimension"], f"{d['score']:.0f}", f"{d['weight_percent']:.0f}%"]
        for d in payload["dimension_scores"]
    ]
    dim_table = Table(dim_table_data, hAlign="LEFT", colWidths=[65 * mm, 20 * mm, 20 * mm])
    dim_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0E3B2E")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(dim_table)

    story.append(Paragraph("Strengths", styles["Section"]))
    story.append(Paragraph(", ".join(payload["strengths"]) or "-", styles["Body"]))
    story.append(Paragraph("Priority gaps", styles["Section"]))
    story.append(Paragraph(", ".join(payload["priority_gaps"]) or "-", styles["Body"]))

    story.append(Paragraph("Critical gates", styles["Section"]))
    gates_line = " | ".join(f"{g['name']}: {g['result']}" for g in payload["critical_gates"])
    story.append(Paragraph(gates_line, styles["Body"]))

    story.append(Paragraph("Recommended actions", styles["Section"]))
    for rec in payload["recommendations"][:5]:
        story.append(Paragraph(f"- {rec['text']}", styles["Body"]))

    story.append(Paragraph("Potential financing pathways", styles["Section"]))
    for pathway in payload["financing_pathways"][:4]:
        story.append(Paragraph(f"- {pathway['name']}: {pathway['description']}", styles["Body"]))

    story.append(Paragraph("Research disclaimer", styles["Section"]))
    story.append(Paragraph(RESEARCH_PROTOTYPE_DISCLAIMER, styles["Body"]))

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
    headers += ["evidence_coverage_percent", "disclaimer"]
    return headers, questions, dimensions, gates


def _csv_row(assessment, questions, dimensions, gates) -> dict:
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
    row["disclaimer"] = RESEARCH_PROTOTYPE_DISCLAIMER
    return row


def generate_csv_report(assessment) -> str:
    headers, questions, dimensions, gates = _csv_headers(assessment)
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    writer.writerow(_csv_row(assessment, questions, dimensions, gates))
    return buffer.getvalue()


def generate_csv_export(assessments) -> str:
    """One CSV for many assessments: the same stable columns as the
    per-assessment CSV report, one row per assessment.

    Columns depend on the framework version (question/dimension/gate codes),
    so every assessment must share one FrameworkVersion. Callers split
    mixed selections by version first.
    """
    assessments = list(assessments)
    if not assessments:
        raise ValueError("No assessments to export.")
    versions = {a.framework_version_id for a in assessments}
    if len(versions) > 1:
        raise ValueError("All assessments in one export must share a framework version.")

    headers, questions, dimensions, gates = _csv_headers(assessments[0])
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    for assessment in assessments:
        writer.writerow(_csv_row(assessment, questions, dimensions, gates))
    return buffer.getvalue()
