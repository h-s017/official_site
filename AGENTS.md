# HANA website defaults

User instruction confirmed 2026-11-12: all future HANA websites and web tools must use the official website's existing colors and fonts by default. This applies to admin tools, student tools, Sites, and HANA OS integrations unless Hana explicitly chooses another design.

- Source of truth: `assets/style.css` and `assets/runtime-layout.css` on hanascent.com.
- Reusable, layout-free definitions: `assets/hana-brand.css` (regenerate with `node scripts/sync-brand-tokens.cjs`).
- White backgrounds; black and neutral gray text, borders and controls. Do not invent a green, cream, or other independent palette.
- Font family: Cormorant Garamond + Noto Serif TC and the official serif fallback stack. Follow the official Chinese/numeric typography rather than adding a sans-serif admin theme.
- Keep form inputs at least 16px on mobile, with readable supporting text and usable controls.
- Follow `docs/HANA_WEB_DEFAULTS.md` when adding or changing a web interface.

## Quote and development management

The integration is at `/admin/quotes/`. It reuses the current Supabase login, `fragrance_quotes` records and private `cost_data.development` JSON. Never copy development details into public quote data.

- MY ORGAN remains the unique material/formula master. This workspace stores references and user-provided snapshots only. GitHub data is not desktop localStorage.
- IFRA calculation starts with actual fragrance grams and actual finished mass. Missing grams stay unknown; never substitute drops, recipe ratios or target weights. Results are preliminary comparisons, not regulatory approvals.
- Client quantity/price and supplier quantity/cost remain independently editable. Do not silently apply suggested prices or snapshot values.
- Do not publish, send, or change a live customer quote as part of code verification. Use local fixtures.
- Keep public fields on an explicit allowlist. Preserve existing alternative-plan pricing semantics.
- Run `node --test tests/quote-development.test.cjs`, existing relevant tests, and syntax checks on modified JavaScript and HTML scripts.
