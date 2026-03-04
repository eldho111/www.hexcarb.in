# HexCarb Website

Static multi-page website for HexCarb with a Carbice-inspired UI direction adapted to HexCarb branding.

## Current Structure

- `index.html` - Homepage
- `shop.html` - Quote-first product family catalog
- `privacy.html` - Privacy policy
- `applications/` - Applications hub and dedicated pathways
  - `index.html`
  - `dispersions.html`
  - `fibers.html`
  - `thermal-interface-materials.html`
  - `swcnt-graphene-hybrid.html`
- `assets/css/` - Shared design system and components
- `assets/js/` - Shared navigation, reveal, and analytics hooks

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

Set a real GA4 ID by replacing:

```js
window.HEXCARB_GA4_ID = "G-XXXXXXXXXX";
```

across pages when you are ready to enable production analytics.

Tracked events:

- `hc_application_nav_click`
- `hc_application_cta_click`
- `hc_quote_click`
- `hc_form_submit`
- `hc_ai_engine_click`

## Background Mapping

Premium ambient backgrounds are controlled per page from the `<body>` tag:

```html
<body class="hc-premium"
      style="--hc-ambient-image: url('/bg-hexc-blur.png');"
      data-hc-bg-image="/bg-hexc-blur.png"
      data-hc-bg-video="/3.mp4"
      data-hc-bg-poster="/3.png"
      data-hc-bg-video-disabled="true">
```

Attributes:

- `data-hc-bg-image`: fallback/static blurred image.
- `data-hc-bg-video`: ambient video source for capable desktop devices.
- `data-hc-bg-poster`: poster for the ambient video.
- `data-hc-bg-video-disabled="true"`: force image-only background on that page.
- `style="--hc-ambient-image: ..."`: hard fallback that renders even if JS is blocked.

## Deployment Notes

- `robots.txt` and `sitemap.xml` are included.
- Ensure DNS/custom domain config remains aligned with `CNAME`.
- GitHub Action `.github/workflows/site-validate.yml` runs validation on push/PR to `main`.
