# Static R1 acceptance record — 2026-10-14

## Delivered, isolated from production

- `Arthur-R1-preview.html`: portable React preview with all eight font/image variants embedded (1,610,881 bytes). It includes the original font license notices. Open the downloaded file in a browser; no local development service is required by its source.
- `REVIEW.html`: screenshot review sheet linking the complete preview and original-resolution images.
- `screenshots/desktop-full.jpg`: final 1280 CSS px wide whole page.
- `screenshots/mobile-full.jpg`: final 390 CSS px wide whole page.
- Four desktop viewport detail captures: Hero, SurgeCart, About and Contact.
- `screenshots/font-specimen.jpg`: same-content Instrument Sans / Inter comparison.
- `screenshots/mobile-about.jpg`: additional mobile portrait composition.

These are actual browser captures, not generated mockups. Screenshot compression is not the source portrait's quality.

## Checks actually performed

- TypeScript compilation: passed.
- Independent Vite study build: passed (25 modules; JS 161.42 kB / gzip 52.17 kB; CSS 29.04 kB / gzip 6.62 kB).
- Existing production build: passed; production entry, CSS and motion modules remain identical to the baseline.
- Opening contract suite + static-study contract suite: 13 passed, 0 failed. These are source contract tests, not animation or real-device certification.
- Latest desktop browser: 1280 × 720 viewport, full document inspected, no horizontal overflow.
- Latest mobile-sized browser: 390 × 844 viewport, full document inspected, no horizontal overflow. Main content, cover illustration, About portrait and Contact were visually checked.
- An earlier 1440 × 1000 layout was inspected before the final body/font refinement; it is not counted as a final-build pass.
- Desktop and mobile project anchors, About, Contact, return-to-top and font comparison navigation were exercised. Mail and telephone destinations were inspected, not invoked to send a message or make a call.
- Both final preview tabs returned no captured console warnings/errors. Tool-provider SDK notices are outside the page logs.
- Browser font status was loaded. The selected Noto subset contains 472 mapped characters; the source-copy cmap check found zero requested missing characters.
- Font comparison uses the actual identity, project names, long Chinese paragraph, years, email and phone.
- Portrait is loaded and displayed without a filter, from the existing responsive asset set. No portrait is placed in Hero.
- The portable HTML rendered correctly when served locally. Direct `file:` navigation is not allowed by the browser testing tool, so an actual offline/file-protocol run was not certified.

## Fixes made during this round

- Repaired missing CJK font coverage without adding a new font family.
- Raised body-text sizes and retained longer Chinese line-height.
- Gave the mobile circular Work link an accessible name.
- Increased mobile transaction-illustration space to prevent overlap with its caption.
- Removed a false link cue from the SurgeCart heading.
- Clearly labelled generated project illustrations as diagrams, not live data or product screenshots.

## Boundaries / not yet passed

- This is a static-design candidate for review, not a claim of award-level completion.
- No production replacement, main-branch merge, motion rebuild or new scroll infrastructure.
- Full keyboard/screen-reader audit, real iOS/Android, browser-engine matrix, 320/768/1024/2560 final-width checks, slow-network and formal performance audits are pending. The viewport override stopped affecting existing tabs during the session; only actual DOM-measured dimensions above are claimed.
- A portrait can appear as its sized dark placeholder during the first asynchronous paint; captures were taken after the image appeared. Loading-state refinement remains a later-stage item.
- Project repository/live-product proof links, actual Offer screenshots and mail-copy feedback are deferred; current project actions lead to Contact and are labelled accordingly.
- Visual acceptance remains the user's decision. Do not start large-scale motion until this composition is accepted.

## Reproducibility

1. `node --test qa/static-study-contract.test.mjs qa/opening-contract.test.mjs`
2. `npx tsc -b`
3. `npx vite build --config vite.study.config.ts`
4. `node design/static-r1/package-preview.mjs`

The baseline, hosting version and rollback procedure are recorded in `BASELINE.md`; design rules are in `DESIGN.md`.
