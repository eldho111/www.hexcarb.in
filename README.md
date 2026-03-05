# HexCarb Website

Static multi-page website for HexCarb with a Carbice-inspired UI direction adapted to HexCarb branding.

## Current Structure

- `index.html` - Homepage
- `shop.html` - Quote-first product family catalog
- `quote.html` - Structured quote funnel
- `thank-you.html` - Quote confirmation page
- `coming-soon.html` - AI Engine launch placeholder
- `proof.html` - Trust/proof center (partial-assets mode)
- `materials-selector.html` - Interactive pre-quote recommender
- `history-of-advanced-nanomaterials.html` - Evidence-first long-scroll timeline page
- `privacy.html` - Privacy policy
- `case-studies/` - Case index + seed case template
  - `index.html`
  - `thermal-electronics.html`
- `applications/` - Applications hub and dedicated pathways
  - `index.html`
  - `dispersions.html`
  - `fibers.html`
  - `thermal-interface-materials.html`
  - `swcnt-graphene-hybrid.html`
- `assets/css/` - Shared design system and components
- `assets/js/` - Shared navigation, reveal, analytics hooks, runtime config, signature interactions
- `assets/media/` - Optimized WebP ambient and hero media
- `assets/media/history/` - History timeline local placeholder visuals
- `assets/icons/` - Favicon and web manifest

Note: AVIF variants are not generated in this local toolchain because AVIF encoder support is unavailable. Current production path uses WebP with PNG fallback.

## Local Preview

From repository root:

```powershell
python -m http.server 5500
```

Open:

- `http://localhost:5500/index.html`
- `http://localhost:5500/shop.html`
- `http://localhost:5500/applications/index.html`
- `http://localhost:5500/history-of-advanced-nanomaterials.html`

## Validation

Run local reference validation before commit:

```powershell
./scripts/validate-site.ps1
```

This checks local `href/src/url(...)` references in HTML/CSS and fails on missing files.

For semantic heading QA:

```powershell
rg -n "<h1" -g "*.html" .
```

Home should have exactly one semantic `<h1>` (hero rotations use one `<h1>` + secondary heading tiers).

## Branch Workflow

```powershell
git checkout -b feature/site-redesign
# edit files
./scripts/validate-site.ps1
git add .
git commit -m "Implement Carbice-inspired HexCarb redesign"
git push -u origin feature/site-redesign
```

## Analytics Hooks

GA4 hooks are implemented in `assets/js/hexcarb-ui.js`.

Runtime GA4 config is read from page meta:

```html
<meta name="hc-ga4-id" content="" />
```

Set the production ID across all pages with:

```powershell
./scripts/set-ga4-id.ps1 -Ga4Id "G-REPLACEWITHYOURID"
```

Tracked events:

- `hc_application_nav_click`
- `hc_application_cta_click`
- `hc_quote_click`
- `hc_form_submit`
- `hc_ai_engine_click`
- `hc_quote_start`
- `hc_quote_step_complete`
- `hc_quote_submit_success`
- `hc_quote_quality_signal`
- `hc_selector_start`
- `hc_selector_recommendation_view`
- `hc_proof_asset_click`
- `hc_case_study_open`
- `hc_theme_toggle`
- `hc_history_milestone_view`
- `hc_history_reference_click`
- `hc_history_application_click`
- `hc_history_quote_click`
- `hc_history_growth_view`
- `hc_history_fact_view`
- `hc_history_gap_click`

## History Page Contract

History page route:

- `/history-of-advanced-nanomaterials.html`

History runtime files:

- `assets/js/history-data.js` - normalized milestone dataset
- `assets/js/history-page.js` - timeline rendering, sticky rail state, era growth bars, facts/gap modules, analytics hooks
- `assets/css/hexcarb-history.css` - history-specific layout and visual modules

Milestone object shape:

`id`, `year_start`, `year_end`, `year_label`, `title`, `summary`, `material_family`, `breakthrough_type`, `current_use_snapshot`, `confidence_level`, `deployment_level`, `impact_tags[]`, `fact_ids[]`, `image`, `references[]`

Reference object shape:

`reference_id`, `title`, `url`, `source_type`, `publication_year`, `accessed_on`

History supporting datasets:

- `window.HEXCARB_HISTORY_ERAS` - four fixed eras used by the growth panel
- `window.HEXCARB_HISTORY_FACTS` - evidence-backed wonder fact cards
- `window.HEXCARB_HISTORY_ADOPTION_GAPS` - citation-backed adoption constraints

History UI contract:

- History page uses `data-hc-signature-bg="history"` to disable decorative node circles and keep a static scientific texture overlay.
- Timeline rail dots are milestone anchors; era bars are data-semantic density indicators.

Suggested QA for History page:

```powershell
rg -n "hc_history_growth_view|hc_history_fact_view|hc_history_gap_click" assets/js/history-page.js
```

## Background Mapping

Premium ambient backgrounds are image-first and controlled per page from the `<body>` tag:

```html
<body class="hc-premium"
      style="--hc-ambient-image: image-set(url('/assets/media/ambient/background-1.webp') type('image/webp'), url('/1.png') type('image/png'));"
      data-hc-bg-image="/assets/media/ambient/background-1.webp"
      data-hc-bg-video-disabled="true">
```

Attributes:

- `data-hc-bg-image`: primary optimized background image.
- `data-hc-bg-video-disabled="true"`: force image-only background on that page.
- `style="--hc-ambient-image: ..."`: hard fallback that renders even if JS is blocked.

## Quote Flow Contract

Primary quote CTAs route to:

`/quote.html?source_page=...&source_section=...&application_slug=...&product_family=...`

Submission redirect target:

- `/thank-you.html`

## AI Engine Link Contract

All website AI Engine buttons currently route to:

- `/coming-soon.html`

## Deployment Notes

- `robots.txt` and `sitemap.xml` are included.
- `sitemap.xml` includes Home, Shop, Quote, Thank You, Privacy, Applications routes, Proof Center, Materials Selector, and Case Studies routes.
- Ensure DNS/custom domain config remains aligned with `CNAME`.
- GitHub Action `.github/workflows/site-validate.yml` runs validation on push/PR to `main`.
