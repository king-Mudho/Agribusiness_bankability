# 23 — UI/UX guidelines

Visual reference: the `FrameworkVersion 0.0` screenshots supplied with this project. Keep
their overall visual language — it reads as credible and institutional — but implement it
as proper design tokens (Tailwind config + CSS variables), not ad hoc inline styles.

## Colour tokens

| Token | Approx. value | Use |
|---|---|---|
| `--color-header` | Deep green, near `#0E3B2E` | Top banner background |
| `--color-accent` | Gold/amber, near `#D6A419` | "ABI" badge, primary CTA buttons ("Calculate Dashboard", "Load Demo Firm") |
| `--color-bg` | Warm cream, near `#F4F1E6` | Page background |
| `--color-surface` | White | Card backgrounds |
| `--color-border` | Light warm grey | Card/input borders |
| `--color-success` | Soft green | "Strengths" panel, PASS gate |
| `--color-warning` | Soft amber | "Conditions / Watchlist" panel, CAUTION gate |
| `--color-danger` | Soft red | "Critical Gaps" panel, NOT_MET gate |
| `--color-text` | Dark green/near-black | Headings |
| `--color-text-muted` | Grey | Body/secondary text |

Apply the success/warning/danger tokens consistently across the traffic-light panels,
gate status chips, and readiness-band pills so colour always carries the same meaning.

## Typography

- Headings: a confident sans-serif at semi-bold weight (system UI sans or a paired
  Google font), sentence case, no all-caps except short eyebrow labels ("0/100" badges,
  section numbers).
  section headers may keep the numbered pattern seen in the reference ("1. Firm
  Assessment", "2. Executive Readiness Summary" ...) since the wizard/dashboard genuinely
  is a numbered sequence.
- Body: regular weight, comfortable line height for form labels and question prompts.
- Data figures (scores, percentages): monospaced or tabular-figure numerals so numbers
  align in tables and cards.

## Component patterns

- **Section badge**: small pill in the corner of each dimension card showing
  `"<score>/100"`, muted green background — matches the reference's `0/100` badges.
- **Five-point response control**: prefer a segmented control or radio-card group over a
  bare `<select>` "Select" dropdown — better for touch targets on mobile at a show booth.
- **Score gauge**: circular ring/donut for the overall ABI (as in the reference's
  "0 / ABI / 100" ring).
- **Radar chart**: six-axis dimension profile, one line for the current assessment.
- **Traffic-light panel trio**: three stacked cards — Strengths (success), Conditions /
  Watchlist (warning), Critical Gaps (danger) — each with a short bulleted list.
- **Certificate panel**: bordered card in the accent colour with a clear "not an official
  rating" disclaimer footer, matching the reference's gold-bordered certificate box.
- **Primary actions**: gold/amber filled buttons ("Calculate Dashboard", "Print / Save
  PDF"); secondary actions as green or outline buttons ("Load Demo Firm", "Export CSV",
  "Reset").

## Layout & responsiveness

- Single-column, card-stacked layout on mobile (as in the reference screenshots) —
  this is the primary device at a show floor.
- Widen to a two-column layout (e.g. dimension profile chart beside dimension score list)
  at tablet/desktop breakpoints.
- Sticky/persistent header showing the ABI badge, title and one-line tagline throughout
  scroll, as in the reference.

## Accessibility

- Every form control has a visible label (not placeholder-only).
- Colour is never the only signal — pair success/warning/danger colour with an icon or
  text label (PASS/CAUTION/NOT MET, not just a coloured dot).
- Minimum touch target ~44px on mobile controls.
- Sufficient contrast between text and background at all token combinations above.
