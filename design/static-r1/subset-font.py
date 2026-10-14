"""Subset an official Noto Sans SC source for this isolated design study.

Usage: <fonttools-python> design/static-r1/subset-font.py /path/to/NotoSansSC.ttf
Only generated font bytes are written; production font assets are untouched.
"""
from pathlib import Path
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1])
copy = (root / 'src/visual-study/main.tsx').read_text()
characters = {ord(c) for c in copy if ord(c) >= 0x3000}
characters.update(range(32, 127))
characters.update(map(ord, '，。；：？！、（）—–·“”‘’→←↗≠×'))
font = TTFont(source)
missing = characters - set(font.getBestCmap())
if missing:
    raise SystemExit(f'Source font does not cover: {"".join(chr(c) for c in sorted(missing))}')
options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=characters)
subsetter.subset(font)
font.flavor = 'woff2'
output = root / 'public/fonts/study-noto-sans-sc.woff2'
font.save(output)
actual = TTFont(output).getBestCmap()
assert characters <= set(actual)
print(f'{output.name}: {output.stat().st_size} bytes; {len(actual)} mapped characters; 0 missing requested characters')
