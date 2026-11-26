"""
Excel (.xlsx) exports via openpyxl. Same data and sources as the PDF/CSV
reports (docs/16_REPORTING_SPECIFICATION.md): every value comes from the
assessment's persisted results, and every workbook carries the research
disclaimer (docs/18_DATA_PRIVACY.md).
"""

import io

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from config.disclaimers import RESEARCH_PROTOTYPE_DISCLAIMER

from apps.assessments.results import build_results_payload

HEADER_FILL = PatternFill("solid", fgColor="0E3B2E")
HEADER_FONT = Font(bold=True, color="FFFFFF")
TITLE_FONT = Font(bold=True, size=14, color="0E3B2E")


def _write_table(ws, headers, rows, start_row=1):
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=start_row, column=col, value=header)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
    for r, row in enumerate(rows, start=start_row + 1):
        for c, value in enumerate(row, start=1):
            ws.cell(row=r, column=c, value=value)
    for col in range(1, len(headers) + 1):
        letter = get_column_letter(col)
        longest = max(
            [len(str(headers[col - 1]))]
            + [len(str(row[col - 1])) for row in rows if col - 1 < len(row) and row[col - 1] is not None],
        )
        ws.column_dimensions[letter].width = min(max(12, longest + 2), 60)
    ws.freeze_panes = ws.cell(row=start_row + 1, column=1)


def _add_disclaimer_sheet(wb):
    ws = wb.create_sheet("Disclaimer")
    ws["A1"] = "Research disclaimer"
    ws["A1"].font = TITLE_FONT
    ws["A3"] = RESEARCH_PROTOTYPE_DISCLAIMER
    ws["A3"].alignment = Alignment(wrap_text=True, vertical="top")
    ws.column_dimensions["A"].width = 100
    ws.row_dimensions[3].height = 60


def _to_bytes(wb) -> bytes:
    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()


def generate_xlsx_report(assessment) -> bytes:
    """One workbook for one assessment: summary, dimensions, gates, action
    plan, financing pathways, answers and the disclaimer."""
    payload = build_results_payload(assessment)
    insights = payload["insights"]
    enterprise = assessment.enterprise

    wb = Workbook()
    ws = wb.active
    ws.title = "Summary"
    ws["A1"] = "Agribusiness Bankability Index -- ABI Demo v0.1"
    ws["A1"].font = TITLE_FONT
    summary = [
        ("Enterprise", enterprise.name),
        ("Respondent code", enterprise.anonymous_respondent_code),
        ("Value chain", enterprise.get_value_chain_display()),
        ("Province", enterprise.get_province_display()),
        ("Framework version", assessment.framework_version.version_label),
        ("Assessment date", assessment.submitted_at.date().isoformat() if assessment.submitted_at else ""),
        ("ABI score (0-100)", payload["abi_score"]),
        ("Readiness band (indicative)", payload["readiness_band"]["label"]),
        ("Evidence coverage %", payload["evidence_coverage_percent"]),
        ("Overall gate status", payload["overall_gate_status"] or ""),
        ("Strengths", ", ".join(payload["strengths"])),
        ("Priority gaps", ", ".join(payload["priority_gaps"])),
    ]
    if insights["next_band"]:
        nb = insights["next_band"]
        summary.append(("Points to next band", f"{nb['points_needed']} to reach {nb['label']} ({nb['min_score']})"))
    peer = insights["peer_benchmark"]
    if peer:
        summary.append((f"Peer average ABI ({peer['label']}, n={peer['sample_size']})", peer["average_abi"]))
    for i, (label, value) in enumerate(summary, start=3):
        ws.cell(row=i, column=1, value=label).font = Font(bold=True)
        ws.cell(row=i, column=2, value=value)
    ws.column_dimensions["A"].width = 42
    ws.column_dimensions["B"].width = 60

    dims = wb.create_sheet("Dimensions")
    peer_dims = peer["dimension_averages"] if peer else {}
    _write_table(
        dims,
        ["Dimension", "Score", "Weight %", "Weighted contribution", "Potential gain (points)", "Peer average"],
        [
            [
                row["dimension"],
                row["score"],
                row["weight_percent"],
                row["weighted_contribution"],
                row["potential_points"],
                peer_dims.get(row["dimension_code"], ""),
            ]
            for row in insights["improvement_potential"]
        ],
    )

    gates = wb.create_sheet("Critical gates")
    _write_table(
        gates,
        ["Gate", "Result", "Note"],
        [[g["name"], g["result"], g["note"]] for g in payload["critical_gates"]],
    )

    plan = wb.create_sheet("Action plan")
    _write_table(
        plan,
        ["Priority", "Dimension", "Recommended action"],
        [[r["priority_rank"], r["dimension"], r["text"]] for r in payload["recommendations"]],
    )

    pathways = wb.create_sheet("Financing pathways")
    _write_table(
        pathways,
        ["Rank", "Potential financing pathway", "Description"],
        [[p["relevance_rank"], p["name"], p["description"]] for p in payload["financing_pathways"]],
    )

    answers = wb.create_sheet("Answers")
    responses = assessment.responses.select_related("question__dimension").order_by(
        "question__dimension__display_order", "question__display_order"
    )
    _write_table(
        answers,
        ["Dimension", "Question code", "Question", "Answer (scale)", "Score"],
        [
            [r.question.dimension.name, r.question.code, r.question.prompt, r.scale_value, r.score_value]
            for r in responses
        ],
    )

    _add_disclaimer_sheet(wb)
    return _to_bytes(wb)


def generate_table_xlsx(sheet_title: str, headers: list[str], rows: list[list]) -> bytes:
    """Generic one-table workbook (plus disclaimer sheet), used by the admin
    portal's bulk exports."""
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_title[:31]
    _write_table(ws, headers, rows)
    _add_disclaimer_sheet(wb)
    return _to_bytes(wb)
