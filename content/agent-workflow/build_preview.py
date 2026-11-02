"""Compile the curated Markdown documents and an offline reader (stdlib only).

Supported authoring subset: ATX headings, fenced code, tables, lists,
blockquotes, links, inline code and emphasis. Raw HTML is escaped.
"""
from pathlib import Path
import base64
import html
import json
import re
import subprocess
import argparse
import shutil

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--site-output', type=Path)
parser.add_argument('--repo', type=Path)
args = parser.parse_args()
REPO = args.repo or ROOT.parents[2] / 'agent-workflow'
SNAPSHOT = json.loads((ROOT / 'snapshot.json').read_text())
SHA = SNAPSHOT['sha']
assert re.fullmatch(r'[0-9a-f]{40}', SHA)
BASE = 'https://cnb.cool/framework-station/agent-workflow/-/blob/' + SHA + '/'
CONFIG = [
    ('overview', '项目概述', '入门', '01-overview.md'),
    ('architecture', '模块与数据边界', '入门', '02-architecture.md'),
    ('bootstrap', '任务初始化与依赖', '核心设计', '08-bootstrap.md'),
    ('evidence', '证据绑定与失效', '核心设计', '03-evidence.md'),
    ('gates', '五个 Gate', '核心设计', '04-gates.md'),
    ('routes', '路线与角色协议', '核心设计', '05-routes.md'),
    ('sessions', '独立会话与交接', '协作与交付', '09-sessions.md'),
    ('adoption', '安装与三方升级', '协作与交付', '06-adoption.md'),
    ('verification', '验证与已知限制', '协作与交付', '07-verification.md'),
]

def inline(text):
    tokens = []
    def save(markup):
        tokens.append(markup)
        return '\x00' + str(len(tokens)-1) + '\x00'
    text = re.sub(r'`([^`]+)`', lambda m: save('<code>' + html.escape(m[1]) + '</code>'), text)
    def link(m):
        label, url = m.groups()
        for ident, _, _, filename in CONFIG:
            if url == filename:
                url = '#' + ident
                break
        if not (url.startswith('https://') or url.startswith('#')):
            return html.escape(label)
        attrs = ' target="_blank" rel="noopener noreferrer"' if url.startswith('https://') else ''
        return save('<a href="'+html.escape(url, quote=True)+'"'+attrs+'>'+inline(label)+'</a>')
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, text)
    text = html.escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', text)
    return re.sub(r'\x00(\d+)\x00', lambda m: tokens[int(m[1])], text)

def render(md):
    lines = md.splitlines()
    out, headings = [], []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith('```'):
            lang = line[3:].strip() or 'text'
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i]); i += 1
            out.append('<div class="code-block"><div class="code-label"><span>'+html.escape(lang)+'</span><button class="copy-code" aria-label="复制代码">复制</button></div><pre><code>'+html.escape('\n'.join(code))+'</code></pre></div>')
            i += 1
            continue
        heading = re.match(r'^(#{1,6}) (.+)$', line)
        if heading:
            level, title = len(heading[1]), heading[2]
            anchor = 'section-' + str(len(headings)+1) if level == 2 else 'document-title'
            if level == 2:
                headings.append({'id':anchor, 'title':title})
            out.append(f'<h{level} id="{anchor}">{inline(title)}</h{level}>')
            i += 1
            continue
        if i+1 < len(lines) and line.startswith('|') and re.match(r'^\|[ :\-|]+\|$', lines[i+1]):
            cells = lambda s: [x.strip() for x in s.strip().strip('|').split('|')]
            heads = cells(line)
            rows = []
            i += 2
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(cells(lines[i])); i += 1
            out.append('<div class="table-scroll" tabindex="0" role="region" aria-label="可横向滚动的表格"><table><thead><tr>'+''.join('<th scope="col">'+inline(c)+'</th>' for c in heads)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table></div>')
            continue
        if re.match(r'^(\d+\. |[-*] )', line):
            ordered = bool(re.match(r'^\d+\. ',line))
            tag = 'ol' if ordered else 'ul'
            items = []
            pattern = r'^\d+\. ' if ordered else r'^[-*] '
            while i < len(lines) and re.match(pattern,lines[i]):
                items.append('<li>'+inline(re.sub(pattern,'',lines[i]))+'</li>'); i += 1
            out.append('<'+tag+'>'+''.join(items)+'</'+tag+'>')
            continue
        if line.startswith('> '):
            out.append('<blockquote><p>'+inline(line[2:])+'</p></blockquote>'); i += 1
            continue
        paragraph = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#|```|\||> |\d+\. |[-*] )', lines[i]):
            paragraph.append(lines[i]); i += 1
        body = ' '.join(paragraph)
        cls = ' class="source-reference"' if body.startswith(('来源：','源码入口：')) else ''
        out.append('<p'+cls+'>'+inline(body)+'</p>')
    return '\n'.join(out), headings

# Range excerpts are copied from the fixed local source snapshot, never fabricated.
RANGES = {
    'README.md': (84, 126),
    '.agent/specs/WorkflowAgentDirective.md': (30, 71),
    '.agent/specs/WorkflowHandoffContract.md': (37, 76),
    '.agent/specs/tools/git-lifecycle-check': (530, 574),
    '.agent/roles/TaskBuilderPrompt.md': (470, 487),
    '.agent/adoption/workflow_adoption.py': (591, 610),
    '.agent/adoption/tests/test_git_lifecycle.py': (1011, 1048),
    '.agent/adoption/tests/test_workflow_adoption.py': (368, 381),
    '.agent/engine/internal/workflow/validator.go': (117, 155),
    '.agent/engine/internal/workflow/paths.go': (5, 57),
    '.agent/engine/internal/workflow/git.go': (65, 98),
    '.agent/engine/internal/workflow/gates.go': (368, 409),
    '.agent/engine/cmd/workflow-check/main.go': (141, 164),
    '.agent/engine/internal/workflow/route.go': (11, 31),
    '.agent/engine/internal/workflow/git_integration_test.go': (313, 329),
    '.agent/engine/internal/workflow/integrity_test.go': (518, 530),
    '.agent/engine/internal/workflow/route_test.go': (294, 313),
}
snapshot_file = ROOT/'source-excerpts.json'
cache = json.loads(snapshot_file.read_text()) if snapshot_file.exists() else {}
if not (REPO / '.git').exists():
    assert cache.get('sha') == SHA, 'Source excerpt snapshot does not match snapshot.json'
cached_sources = cache.get('sources', {})
sources = {}
pages = []
for ident, title, group, filename in CONFIG:
    md = (ROOT/'docs'/filename).read_text()
    body, headings = render(md)
    refs = []
    for url in re.findall(r'\]\((https://[^)]+)\)', md):
        if not url.startswith(BASE):
            continue
        path = url[len(BASE):].split('#')[0]
        if path not in refs:
            refs.append(path)
        if (REPO/'.git').exists():
            raw = subprocess.check_output(['git','show',SHA+':'+path],cwd=REPO,text=True).splitlines()
            start, end = RANGES.get(path, (1, min(48,len(raw))))
            assert 1 <= start <= end <= len(raw), (path,start,end,len(raw))
            sources[path] = {'path':path, 'name':path.split('/')[-1], 'start':start, 'end':min(end,len(raw)), 'code':'\n'.join(raw[start-1:end]), 'url':BASE+path+'#L'+str(start)}
        elif path in cached_sources:
            sources[path] = cached_sources[path]
        assert path in sources and sources[path]['code'], path
    pages.append({'id':ident,'title':title,'group':group,'file':'docs/'+filename,'markdown':md,'html':body,'headings':headings,'sources':refs})
snapshot_file.write_text(json.dumps({'sha':SHA,'sources':sources},ensure_ascii=False,indent=2)+'\n')
data = {**SNAPSHOT,'pages':pages,'sources':sources}
(ROOT/'content.js').write_text('window.WORKFLOW_DOCS = '+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';\n')
index = (ROOT/'shell.html').read_text()
for key, value in {'COMMIT': SHA, 'SHORT_COMMIT': SHA[:7], 'VERSION': SNAPSHOT['version'], 'PAGE_COUNT': str(len(pages))}.items():
    index = index.replace('{{'+key+'}}', value)
index = re.sub(r'<!--INITIAL_ARTICLE-->.*?<!--/INITIAL_ARTICLE-->', '<!--INITIAL_ARTICLE-->', index, flags=re.S)
index = index.replace('<!--INITIAL_ARTICLE-->', '<!--INITIAL_ARTICLE-->'+pages[0]['html']+'<!--/INITIAL_ARTICLE-->')
(ROOT/'index.html').write_text(index)

def data_url(path,mime):
    return 'data:'+mime+';base64,'+base64.b64encode((ROOT/path).read_bytes()).decode()
css = (ROOT/'styles.css').read_text()
css = css.replace('assets/fonts/instrument-sans.woff2',data_url('assets/fonts/instrument-sans.woff2','font/woff2'))
css = css.replace('assets/framework-symbol.svg',data_url('assets/framework-symbol.svg','image/svg+xml'))
portable = index.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>')
portable = portable.replace('href="assets/framework-symbol.svg"','href="'+data_url('assets/framework-symbol.svg','image/svg+xml')+'"')
for script in ['content.js','app.js']:
    portable = portable.replace('  <script src="'+script+'" defer></script>\n','')
scripts = '\n'.join((ROOT/x).read_text() for x in ['content.js','app.js']).replace('</script','<\\/script')
portable = portable.replace('</body>','<script>'+scripts+'</script>\n</body>')
(ROOT/'preview.html').write_text(portable)
print(f'Compiled {len(pages)} Markdown pages, {len(sources)} source excerpts; portable preview {len(portable.encode())} bytes.')

if args.site_output:
    destination = args.site_output.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    (destination / 'index.html').write_text(portable)
    for path in (ROOT / 'docs').glob('*.md'):
        (destination / 'docs').mkdir(exist_ok=True)
        shutil.copy2(path, destination / 'docs' / path.name)
    (destination / 'snapshot.json').write_text(json.dumps(SNAPSHOT, ensure_ascii=False, indent=2)+'\n')
    print('Exported same-origin project reader:', destination)
