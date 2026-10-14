# R1 static design baseline — 2026-10-14

## Verified source and rollback

- Canonical remote: https://cnb.cool/framework-station/my-station
- Local and remote `main`: `93dae0854688f5fc6e235ed19ca3c50df9aa9030` (read-only `ls-remote` verified 2026-10-14).
- Working tree was clean before this task.
- Local immutable baseline tag: `baseline/pre-static-r1-20261014`.
- Working branch: `design/static-r1`.
- The study has separate HTML, React entry point, CSS, and build config. Production `App.tsx`, `src/main.tsx`, opening/motion modules, and production Vite entry points are not changed.
- Source recovery: create a new branch from the baseline tag. Do not reset an occupied or dirty checkout.

## Existing hosted version — retained, not replaced

- Site: `appgprj_6ab0fc9101b081919f38f92a743a5d26`.
- URL: https://song-wenqing-portfolio-direction-demo.gongongzzxxcc123.chatgpt.site
- Version: 18, `appgprj_6ab0fc9101b081919f38f92a743a5d26~appgver_0f2702c29bf08191b6b09320de7c0bdd`.
- Sites source commit: `bc9f0ab5e4912ea43b33cb2e450acdd603fc9258` (different source mirror from CNB).
- Deployment: `appgdep_6ace10b1e59881918ff30e8377e5d2bd`.
- Archive hash: `sha256:03789afc4e58a09e1613cbecb92212fe3400f4aca2aa24186c5bd32603eb31ae`.
- Audience: custom, owner only. No access changes are authorized or made by this study.
- Verified using native site metadata/version listing. Existing browser page exposes eight-language-era content and current projects. No deployment is performed in this task.
- If a later release needs rollback, redeploy the retained archive-backed version above using Sites, preserving its audience. Git rollback alone does not change the hosted site.

## Assets reused

- Instrument Sans WOFF2 (~73 KiB): selected Latin typeface.
- Existing Noto Sans SC WOFF2 (~115 KiB): only 354 mapped glyphs. A sample coverage check found missing common Chinese characters. It remains untouched for the existing site.
- Study-only Noto Sans SC subset: 146,912 bytes, 472 mapped characters, zero missing requested characters. Derived from the official Google Fonts source with `subset-font.py`; see `FONT-SOURCES.md`.
- Inter WOFF2 (~344 KiB): comparison specimen only, not used by the portfolio study.
- Existing SIL OFL 1.1 files retained. The official Noto Sans SC source was downloaded to repair coverage; no new font family or paid font dependency is introduced.
- Portrait: existing 640/960/1440/2160 WebP sources. No filter, blur, generative retouching, or new likeness is introduced.
- Work visuals are code-native diagrams. Offer explicitly says it is not a product screenshot; Workflow is an illustrative scenario, not a real log. Real product captures and evidence links belong to the next content stage.

## Preview boundaries

- `/visual-study/`: whole-page, intentionally still; native anchors and contact links work.
- `/visual-study/?specimen=1`: real-content Instrument/Inter comparison.
- No GSAP, Lenis, opening, scroll lock, pointer loop, sticky storytelling, or CSS animations are imported by the study.
- Run `npx vite --config vite.study.config.ts --host 127.0.0.1 --port 4174 --strictPort` for a local preview.
- Build with `npx vite build --config vite.study.config.ts` (separate `dist-study/`).
- Original production build remains `npm run build`.
