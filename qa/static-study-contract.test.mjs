import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const entry = read('src/visual-study/main.tsx');
const css = read('src/visual-study/study.css');
const baseline = '93dae0854688f5fc6e235ed19ca3c50df9aa9030';

test('production entry, styles and motion are identical to the recorded baseline', () => {
  for (const path of ['src/App.tsx','src/main.tsx','src/styles.css','src/motion.ts','src/components/FirstHero.tsx','src/components/Opening.tsx','src/components/opening-timeline.ts','vite.config.ts']) {
    assert.equal(read(path), execFileSync('git',['show',`${baseline}:${path}`],{cwd:root,encoding:'utf8'}), path);
  }
});
test('study is built independently and has no motion or hidden content dependency', () => {
  assert.match(read('vite.study.config.ts'), /outDir: 'dist-study'/);
  assert.match(read('vite.study.config.ts'), /input: 'visual-study\/index.html'/);
  assert.doesNotMatch(entry, /from ['"].*(?:gsap|lenis|Opening|motion)['"]|requestAnimationFrame|setTimeout/);
  assert.doesNotMatch(css, /@keyframes|animation\s*:|transition\s*:|position:\s*sticky/);
  assert.match(css, /scroll-behavior:\s*auto/);
});
test('study uses the intended content order and truthful diagram labels', () => {
  const ids = [...entry.matchAll(/<article[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(ids,['surgecart','offer','workflow']);
  assert.match(entry,/支付使用 Mock/);
  assert.match(entry,/MySQL 请求表排队/);
  assert.match(entry,/非产品截图/);
  assert.match(entry,/非真实运行日志/);
  assert.doesNotMatch(entry,/腾讯|Tencent|微信读书|QPS|99\.9/);
});
test('all local hash targets exist and reduced mobile link text has an accessible name', () => {
  const ids = new Set([...entry.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const match of entry.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]),match[1]);
  assert.match(entry,/className="hero-work-link"[^>]*aria-label="看看我在做什么，前往作品"/);
  assert.match(entry,/href="mailto:1784870640@qq.com"/);
  assert.match(entry,/href="tel:\+8618256109164"/);
});
test('portrait uses original responsive assets and lives only in About', () => {
  assert.match(entry,/640\.webp 640w.*960\.webp 960w.*1440\.webp 1440w.*2160\.webp 2160w/);
  assert.equal((entry.match(/<Portrait \/>/g)||[]).length,1);
  assert.ok(entry.indexOf('<Portrait />') > entry.indexOf('id="about"'));
  assert.match(css,/\.about-photo img[^}]*filter:\s*none/);
});
test('font references are isolated and covered subset is used', () => {
  assert.match(css,/study-noto-sans-sc\.woff2/);
  assert.match(read('visual-study/index.html'),/study-noto-sans-sc\.woff2/);
  assert.match(css,/\.sample-inter\s*\{\s*font-family:\s*'Study Inter'/);
  assert.match(read('design/static-r1/FONT-SOURCES.md'),/472 mapped characters/);
});
