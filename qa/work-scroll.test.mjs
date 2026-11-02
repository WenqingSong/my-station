// Deterministic geometry/content contracts; browser scroll QA is separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { workEvidence } from '../src/components/work-evidence.ts';

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const work = source('src/components/SelectedWork.tsx');
const css = source('src/components/selected-work.css');
const app = source('src/App.tsx');

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

test('project chapters use document flow without overlapping scroll transforms', () => {
  assert.match(css, /\.work-scene\{position:relative;top:auto;min-height:0;margin-bottom:0/);
  assert.doesNotMatch(work, /ScrollTrigger|workSceneMetrics|scrub:|clipPath:|ResizeObserver/);
  assert.match(work, /IntersectionObserver/);
  assert.match(work, /observer.unobserve/);
  assert.match(work, /work-project-pagination/);
  assert.match(work, /previousProject/);
  assert.match(work, /work-flow-marker/);
  // Progressive enhancement: no hidden content before the observer executes.
  assert.doesNotMatch(css, /work-art[^{}]*\{[^}]*opacity:0[;}]/);
});

test('mobile visuals remain touch operable and reduced motion avoids entrances', () => {
  assert.match(work, /onClick=\{\(\) => setExpanded/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.work-art-entered\{animation:none\}/);
  assert.match(css, /work-still \.work-art-entered\{animation:none\}/);
});

test('Introduction is merged without losing its anchor or internship facts', () => {
  assert.doesNotMatch(app, /A LITTLE INTRODUCTION/);
  assert.match(work, /id="intro"/);
  assert.match(work, /杭州智航星辰人工智能科技有限公司/);
  for (const id of ['work', 'skills', 'about', 'contact']) {
    assert.ok(app.includes(`id="${id}"`) || work.includes(`id="${id}"`) || id === 'about');
  }
});

test('Hero and About keep their composition; Contact only adds the brand signature', () => {
  const hero = source('src/components/FirstHero.tsx');
  const originalHero = execFileSync('git', ['show', 'aa81238:src/components/FirstHero.tsx'], { encoding: 'utf8' });
  // Appearance and brand controls extend the footer; preserve the original composition above it.
  const composition = text => text.slice(text.indexOf('  return <section'), text.indexOf('    <span className="first-scroll-cue"'));
  assert.equal(composition(hero), composition(originalHero));
  assert.equal(source('src/components/about-editorial.css'), execFileSync('git', ['show', 'aa81238:src/components/about-editorial.css'], { encoding: 'utf8' }));
  const originalApp = execFileSync('git', ['show', 'aa81238:src/App.tsx'], { encoding: 'utf8' });
  const contact = text => text.slice(text.indexOf('<section className="contact"'), text.indexOf('</main>'));
  const signature = '<span className="framework-signature"><span className="framework-mark" aria-hidden="true" />FRAMEWORK</span>';
  assert.equal(contact(app).replace(signature, ''), contact(originalApp));
  const about = source('src/components/AboutEditorial.tsx');
  const originalAbout = execFileSync('git', ['show', 'aa81238:src/components/AboutEditorial.tsx'], { encoding: 'utf8' });
  // Loading/decode state may change; preserve the editorial copy and all eight
  // responsive resources, plus its original scroll-reveal timeline.
  const narrative = text => text.slice(text.indexOf('      <div className="about-narrative"')).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(narrative(about), narrative(originalAbout));
  assert.deepEqual(about.match(/\/arthur-editorial-[\d]+\.(webp|jpg)/g), originalAbout.match(/\/arthur-editorial-[\d]+\.(webp|jpg)/g));
  const timeline = text => text.slice(text.indexOf('    const context = gsap.context'), text.indexOf('  }, [disabled, compact])'));
  assert.equal(timeline(about), timeline(originalAbout));
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
