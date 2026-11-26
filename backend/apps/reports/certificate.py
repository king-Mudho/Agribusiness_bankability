"""
One-page landscape "Bankability Certificate" PDF -- the printable version of
the results screen's certificate panel. Carries the verbatim certificate
footer and the research disclaimer from docs/18_DATA_PRIVACY.md. Wording
stays indicative: no "approved", "credit rating" or "guarantee" claims
(AGENTS.md ground rule 2), except inside the required disclaimer text.
"""

import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from config.disclaimers import CERTIFICATE_DISCLAIMER, RESEARCH_PROTOTYPE_DISCLAIMER

from apps.assessments.results import build_results_payload

GREEN = colors.HexColor("#0E3B2E")
GOLD = colors.HexColor("#D4A21A")
MUTED = colors.HexColor("#555555")


def _wrap(c, text, font, size, max_width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if c.stringWidth(trial, font, size) <= max_width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def generate_certificate_pdf(assessment) -> bytes:
    payload = build_results_payload(assessment)
    enterprise = assessment.enterprise
    buffer = io.BytesIO()
    width, height = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    c.setTitle(f"ABI Bankability Certificate -- {enterprise.name}")

    # Frame
    c.setStrokeColor(GOLD)
    c.setLineWidth(4)
    c.rect(12 * mm, 12 * mm, width - 24 * mm, height - 24 * mm)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1)
    c.rect(16 * mm, 16 * mm, width - 32 * mm, height - 32 * mm)

    cx = width / 2
    y = height - 38 * mm
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(cx, y, "AGRIBUSINESS BANKABILITY INDEX  --  ABI DEMO v0.1")
    y -= 14 * mm
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(cx, y, "Bankability Certificate")
    y -= 9 * mm
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(cx, y, "Research prototype -- indicative financing-readiness result")

    y -= 16 * mm
    c.setFont("Helvetica", 12)
    c.drawCentredString(cx, y, "Issued for")
    y -= 11 * mm
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(cx, y, enterprise.name)
    y -= 7 * mm
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    c.drawCentredString(
        cx,
        y,
        f"{enterprise.get_value_chain_display()}  |  {enterprise.get_province_display()}  |  "
        f"Respondent code {enterprise.anonymous_respondent_code}",
    )

    # Score block
    y -= 22 * mm
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 44)
    c.drawRightString(cx - 6 * mm, y, f"{payload['abi_score']:.0f}")
    c.setFont("Helvetica", 14)
    c.drawString(cx - 4 * mm, y + 14, "/ 100  ABI score")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(cx - 4 * mm, y - 2, payload["readiness_band"]["label"])
    y -= 10 * mm
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    issued = assessment.submitted_at.date().isoformat() if assessment.submitted_at else "-"
    c.drawCentredString(
        cx,
        y,
        f"Evidence coverage {payload['evidence_coverage_percent']:.0f}%   |   "
        f"Framework version {assessment.framework_version.version_label}   |   Assessment date {issued}",
    )

    # Dimension strip
    y -= 12 * mm
    dims = payload["dimension_scores"]
    if dims:
        col_w = (width - 60 * mm) / len(dims)
        x0 = 30 * mm
        for i, d in enumerate(dims):
            x = x0 + i * col_w + col_w / 2
            c.setFillColor(GREEN)
            c.setFont("Helvetica-Bold", 13)
            c.drawCentredString(x, y, f"{d['score']:.0f}")
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 7.5)
            for j, line in enumerate(_wrap(c, d["dimension"], "Helvetica", 7.5, col_w - 4)):
                c.drawCentredString(x, y - 4 * mm - j * 3.2 * mm, line)

    # Footer disclaimers
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(cx, 32 * mm, CERTIFICATE_DISCLAIMER)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    for j, line in enumerate(_wrap(c, RESEARCH_PROTOTYPE_DISCLAIMER, "Helvetica", 7, width - 70 * mm)):
        c.drawCentredString(cx, 27 * mm - j * 3.2 * mm, line)

    c.showPage()
    c.save()
    return buffer.getvalue()
