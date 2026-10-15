# Lower-page Chinese subset

`lower-page-sc.woff2` is a subset of Noto Sans SC, using the same OFL license included as `NotoSansSC-OFL.txt`. The input collects 443 non-ASCII codepoints from App (project headings), SelectedWork, work-evidence, AboutEditorial and Contact; 442 are mapped in the font. Revision: October 16, 2026. Size: 114,496 bytes. It is scoped to the lower page; it does not replace Hero or Opening font assets.

Produced with FontTools `fontTools.subset`, WOFF2 output, all layout features retained, from the Noto Sans SC variable TTF used in the earlier font comparison. On copy changes, regenerate the union of non-ASCII codepoints in those five source files. Do not overwrite the separate Hero/Opening font assets. `font-display: optional` keeps the system fallback stable on a slow first load instead of swapping visible glyphs late. Opening retains its own bounded font-loading decision.
