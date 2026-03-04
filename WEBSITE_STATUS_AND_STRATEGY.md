# HexCarb Website Status, Issues, Optimization Pathways, and Next Strategy

## 1) Current status (snapshot)

- The website is currently a **static GitHub Pages style deployment** with two primary pages: `index.html` (brand/landing page) and `shop.html` (catalog-style shop page).
- Styling is generated at runtime via the **Tailwind CDN** rather than a build pipeline.
- The website is content-rich and visually ambitious (hero video, multiple sections, dark mode toggle, product catalog cards hydrated through client-side JavaScript).
- Contact and lead capture flows are present through **Formspree** and mailto links.

## 2) Current issues that should be solved

### A) Broken or missing assets (high priority)

`index.html` references image files that are not present in the repository:
- `aerospace.jpg`
- `wearables.jpg`
- `energy.jpg`
- `infrastructure.jpg`
- `about-hexcarb.jpg`

These cause visual gaps and reduce trust/perceived quality.

### B) Broken internal link (high priority)

`shop.html` links to `/privacy.html`, but that file does not exist in the repo, resulting in a 404.

### C) Performance risks from asset weight and runtime CSS (high priority)

- Heavy media payload on the landing page:
  - `1.png` ~2.2 MB
  - `bg-hexc-blur.png` ~2.2 MB
  - `3.mp4` ~3.4 MB
- Tailwind via CDN means users pay runtime JS/CSS setup cost and cannot benefit from fully tree-shaken production CSS.

### D) SEO and discoverability are underpowered (medium priority)

- Basic metadata exists, but there is no evidence of structured data (Organization/Product), no sitemap, and no robots file.
- Shop content has many product cards but no product schema or crawl hints.

### E) Conversion and product readiness gaps (medium priority)

- Most product entries use blank price fields (`data-price=""`) and CTA links set to `#`.
- This is useful for catalogue mode but weak for qualified lead conversion unless supported by clearer enquiry funnels.

### F) Quality process gap (medium priority)

- There is no automated validation visible for missing assets/links/performance budgets.
- Regressions (like missing images and missing privacy page) can slip through silently.

## 3) Website optimization pathways

## Pathway 1: Reliability & trust baseline (Week 1)

1. Restore or replace all missing images in `index.html`.
2. Add a real `privacy.html` page, or remove/update the footer link.
3. Add a simple link/asset check in CI (or pre-commit script) to fail on missing local resources.
4. Verify all primary CTA routes (`/shop.html`, `https://ai.hexcarb.in`, Formspree form).

**Outcome:** eliminates visible breakage and improves first impression.

## Pathway 2: Core web performance (Weeks 1–2)

1. Convert heavy PNG assets to WebP/AVIF and serve responsive sizes.
2. Add lazy loading for below-the-fold images and defer non-critical visuals.
3. Add `poster` and preload strategy for video; keep reduced-motion behavior.
4. Move from Tailwind CDN to build-time Tailwind output (minimal generated CSS).
5. Introduce basic performance budgets (LCP/total bytes).

**Outcome:** better LCP, lower bounce on mobile, improved UX in low bandwidth.

## Pathway 3: SEO foundation (Weeks 2–3)

1. Add `sitemap.xml` and `robots.txt`.
2. Add JSON-LD schema:
   - Organization schema on homepage
   - Product/Service schema on shop sections
3. Expand metadata with social image(s) and unique page-level OG tags.
4. Add canonical discipline for all pages.

**Outcome:** improved crawlability and higher quality search presence.

## Pathway 4: Conversion optimization (Weeks 3–4)

1. Replace `#` CTAs with explicit intent paths:
   - “Request Quote” with prefilled product context
   - “Download datasheet” gated lead form
2. Add lightweight qualification form fields (industry, application, quantity, timeline).
3. Add trust signals (certifications, partner logos, test methods, turnaround promise).
4. Instrument events for CTA clicks and form submissions.

**Outcome:** better lead quality and measurable funnel performance.

## 4) Recommended next strategy

## Strategic goal (next 30 days)

Move from “good-looking static brochure” to a **credible, measurable B2B lead engine**.

## Priority sequence

1. **Fix trust blockers immediately**
   - Missing images + missing privacy page + broken links.
2. **Reduce load times**
   - Compress assets and stop runtime Tailwind CDN usage.
3. **Strengthen discoverability**
   - SEO technical baseline + schema.
4. **Improve conversion mechanics**
   - Replace passive catalogue behaviors with quote-driven flows.
5. **Add monitoring loop**
   - Basic analytics dashboard: sessions, CTA CTR, enquiry completion, top product interest.

## Suggested KPI targets (initial)

- Homepage LCP under 2.5s on mid-tier mobile.
- 0 broken internal links/assets in release checks.
- +30% improvement in quote-enquiry CTA click-through.
- Track top 5 product-interest sections by click and enquiry rate.

## 5) Execution model

- Keep the current static architecture for now (fastest iteration), but add a lightweight build/release pipeline.
- Ship improvements in weekly increments with explicit before/after metrics.
- Use a “fix first, optimize second, scale third” cadence to avoid overengineering.
