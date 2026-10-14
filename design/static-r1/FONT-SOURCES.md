# Font assets and coverage — 2026-10-14

## Selected pair

Instrument Sans (existing local asset) + Noto Sans SC. Inter is used only on the comparison page; the normal study does not reference that face in its computed font stacks.

The existing CJK WOFF2 has 354 mapped glyphs. The sample `我是宋文清，预计毕业。个人项目：订单与库存、失败恢复、求职匹配、简历、校验器、审查、网球、骑行、影视剧。模型的回答，先检查再使用。` lacked `使先再审库查答：`. That makes per-character system fallback unavoidable with the old file.

## Study-only subset

- Official source: https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf
- Official license: https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt
- The license was retrieved on 2026-10-14 and matches the existing `public/fonts/NotoSansSC-OFL.txt` (Adobe copyright, reserved name Source). All three font notices are also embedded in the portable preview.
- Source SHA-256: `a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`.
- Subset: `public/fonts/study-noto-sans-sc.woff2`.
- Subset SHA-256: `dce112c645a49d74afba77a977fe1478f3daaeb0d3c2170f419938c3b4af47b2`.
- 146,912 bytes; 472 mapped characters; zero requested missing characters in a FontTools cmap assertion.
- Generated from the study's TSX copy, ASCII, and punctuation using `design/static-r1/subset-font.py`. Run again if the copy gains characters outside this subset.
- Production font references are unchanged. Only the new independent entry uses this subset.

The original portrait and all existing font license files are preserved. No face edits or downloaded decorative image assets are introduced.
