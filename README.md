# HexCarb Website

Static multi-page website for HexCarb with a Carbice-inspired UI direction adapted to HexCarb branding.

## Current Structure

- `index.html` - Homepage
- `shop.html` - Quote-first product family catalog
- `quote.html` - Structured quote funnel
- `thank-you.html` - Quote confirmation page
- `coming-soon.html` - AI Engine launch placeholder
- `privacy.html` - Privacy policy
- `applications/` - Applications hub and dedicated pathways
  - `index.html`
  - `dispersions.html`
  - `fibers.html`
  - `thermal-interface-materials.html`
  - `swcnt-graphene-hybrid.html`
- `assets/css/` - Shared design system and components
- `assets/js/` - Shared navigation, reveal, analytics hooks, runtime config
- `assets/media/` - Optimized WebP ambient and hero media

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

## Validation

Run local reference validation before commit:

```powershell
./scripts/validate-site.ps1
```

This checks local `href/src/url(...)` references in HTML/CSS and fails on missing files.

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
- Ensure DNS/custom domain config remains aligned with `CNAME`.
- GitHub Action `.github/workflows/site-validate.yml` runs validation on push/PR to `main`.
