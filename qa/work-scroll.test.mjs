// Deterministic geometry/content contracts; browser scroll QA is separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { workSceneMetrics } from '../src/components/work-scene-metrics.ts';
import { workEvidence } from '../src/components/work-evidence.ts';

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const work = source('src/components/SelectedWork.tsx');
const css = source('src/components/selected-work.css');
const app = source('src/App.tsx');

test('tall scenes expose their entire content before the next scene arrives', () => {
  for (const viewport of [568, 720, 900, 1080, 1440]) {
    for (const height of [760, 940, 1200, 1800]) {
      const metrics = workSceneMetrics(height, viewport);
      assert.equal(metrics.top, Math.min(0, viewport - height));
      assert.ok(metrics.hold >= 240);
      assert.ok(metrics.top + height <= Math.max(height, viewport));
      if (height > viewport) assert.equal(metrics.top + height, viewport);
    }
  }
});

test('every project has a problem, a decision, bounded claims and pinned evidence', () => {
  assert.deepEqual(Object.keys(workEvidence), ['delivery', 'backend', 'matching']);
  for (const evidence of Object.values(workEvidence)) {
    for (const field of ['problem', 'decision', 'evidence', 'boundary']) assert.ok(evidence[field].length > 20);
    assert.match(evidence.repo, /^https:\/\/cnb\.cool\/framework-station\//);
    assert.equal(evidence.links.length, 2);
    for (const link of evidence.links) assert.match(link.url, /\/-\/blob\/[a-f0-9]{40}\//);
    assert.doesNotMatch(JSON.stringify(evidence), /\d[\d,.]*\s*(?:QPS|TPS|ms|万用户)|生产验证通过/);
  }
  assert.match(workEvidence.delivery.boundary, /Mock/);
  assert.match(workEvidence.delivery.decision, /MySQL 请求表/);
});

test('work preserves sticky scenes, mask reveal, scrubbed crop, parallax and handoff', () => {
  assert.match(css, /\.work-scene\{position:sticky/);
  assert.match(work, /compact \|\| disabled \? 'work-linear' : ''/);
  assert.match(work, /scene-title-line/);
  assert.match(work, /clipPath: 'inset\(0% 0% 0% 0% round 4px\)'/);
  assert.match(work, /yPercent: -3, scale: 1/);
  assert.match(work, /scale: \.96, opacity: \.35/);
  assert.match(work, /scrub: \.65/);
  assert.match(work, /work-flow-marker/);
  assert.match(work, /ResizeObserver/);
  assert.match(work, /document.fonts.ready/);
  assert.match(work, /context.revert\(\)/);
});

test('mobile still has a scroll crop and a touch-operable visual; reduced motion is readable', () => {
  assert.ok(work.indexOf("clipPath: 'inset(0%") < work.indexOf('if (compact) return;'));
  assert.match(work, /onClick=\{\(\) => setExpanded/);
  assert.match(css, /work-still \.scene-art-crop\{clip-path:none!important\}/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('Introduction is merged without losing its anchor or internship facts', () => {
  assert.doesNotMatch(app, /A LITTLE INTRODUCTION/);
  assert.match(work, /id="intro"/);
  assert.match(work, /杭州智航星辰人工智能科技有限公司/);
  for (const id of ['work', 'skills', 'about', 'contact']) {
    assert.ok(app.includes(`id="${id}"`) || work.includes(`id="${id}"`) || id === 'about');
  }
});

test('opening, Hero, About and Contact markup match the rollback baseline', () => {
  for (const file of ['src/components/FirstHero.tsx', 'src/components/Opening.tsx', 'src/components/opening-sequence.ts', 'src/components/AboutEditorial.tsx', 'src/components/about-editorial.css']) {
    assert.equal(source(file), execFileSync('git', ['show', `aa81238:${file}`], { encoding: 'utf8' }));
  }
  const originalApp = execFileSync('git', ['show', 'aa81238:src/App.tsx'], { encoding: 'utf8' });
  const contact = text => text.slice(text.indexOf('<section className="contact"'), text.indexOf('</main>'));
  assert.equal(contact(app), contact(originalApp));
});

test('shared reveal animations are unchanged; initial anchors wait for opening unlock', () => {
  const motion = source('src/motion.ts');
  const original = execFileSync('git', ['show', 'aa81238:src/motion.ts'], { encoding: 'utf8' });
  assert.equal(motion.slice(motion.indexOf('  useLayoutEffect')), original.slice(original.indexOf('  useLayoutEffect')));
  assert.match(motion, /initialHashPending = useRef\(Boolean\(location.hash\)\)/);
  assert.match(motion, /requestAnimationFrame\(restoreInitial\)/);
  assert.match(motion, /if \(restoreHash\(\)\) initialHashPending.current = false/);
  assert.match(motion, /cancelAnimationFrame\(initialHashFrame\)/);
});
