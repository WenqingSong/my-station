// Node 22.18+ (native TypeScript stripping). These are deterministic timeline
// and source-contract checks, not browser/rendering or real-device acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GREETINGS, OPENING_MOTION, openingSchedule } from '../src/components/opening-sequence.ts';
import { createOpeningTimeline } from '../src/components/opening-timeline.ts';

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const fixture = () => {
  const schedule = openingSchedule();
  const masks = GREETINGS.map(() => ({ visibility: 'hidden' }));
  const glyphs = GREETINGS.map(word => Array.from(word.text).map(() => ({ y: 150 })));
  const dot = { x: 0, y: 0, opacity: 0 };
  const panel = { yPercent: 0 };
  const skip = { opacity: 1 };
  const phases = [];
  let completed = 0;
  const timeline = createOpeningTimeline({ masks, glyphs, widths: GREETINGS.map(word => word.text.length * 70),
    dot, panel, skip, schedule, motion: OPENING_MOTION,
    onPhase: (phase, index) => phases.push({ phase, index }), onComplete: () => { completed++; } });
  return { timeline, schedule, masks, glyphs, dot, panel, skip, phases, completed: () => completed };
};

test('eight distinct languages, Chinese first and English last', () => {
  assert.equal(GREETINGS.length, 8);
  assert.equal(new Set(GREETINGS.map(word => word.locale)).size, 8);
  assert.equal(GREETINGS[0].text, '你好');
  assert.equal(GREETINGS.at(-1).text, 'Hello');
  assert.ok(GREETINGS.every(word => word.hold >= .22));
});

test('the complete GSAP timeline matches the timing plan and safety margin', () => {
  const f = fixture();
  assert.ok(Math.abs(f.timeline.duration() - f.schedule.duration) < .00001);
  assert.ok(f.schedule.duration >= 6 && f.schedule.duration <= 6.5);
  assert.ok(f.schedule.duration * 1000 + OPENING_MOTION.fontDeadlineMs < OPENING_MOTION.safetyDeadlineMs);
  assert.equal(f.timeline.paused(), true);
  f.timeline.kill();
});

test('every word has a stationary, fully aligned hold before it leaves', () => {
  const f = fixture();
  f.schedule.words.forEach((word, index) => {
    f.timeline.seek((word.holdAt + word.leaveAt) / 2, false);
    assert.equal(f.masks[index].visibility, 'visible');
    assert.ok(f.glyphs[index].every(glyph => glyph.y === 0));
    assert.equal(f.phases.at(-1).phase, 'hold');
    assert.equal(f.phases.at(-1).index, index);
  });
  f.timeline.kill();
});

test('natural completion removes every word and fully clears the curtain', () => {
  const f = fixture();
  f.timeline.progress(1, false);
  assert.equal(f.completed(), 1);
  assert.equal(f.panel.yPercent, -101);
  assert.equal(f.dot.opacity, 0);
  assert.equal(f.skip.opacity, 0);
  assert.ok(f.masks.every(mask => mask.visibility === 'hidden'));
  assert.deepEqual(f.phases.filter(event => event.phase === 'enter').map(event => event.index), [0,1,2,3,4,5,6,7]);
  f.timeline.kill();
});

test('Hello ends with the blue dot as punctuation', () => {
  const f = fixture();
  f.timeline.seek(f.schedule.curtainAt - .04, false);
  assert.equal(f.dot.x, 5 * 70 / 2 + 24);
  assert.equal(f.dot.y, 30);
  assert.equal(f.dot.opacity, 1);
  f.timeline.kill();
});

test('source contract: refresh is unconditional except reduced motion, with no visit cache or hash gate', () => {
  const opening = source('src/components/Opening.tsx');
  assert.match(opening, /useState\(\(\) => !reduced\)/);
  assert.doesNotMatch(opening, /localStorage|sessionStorage|SEEN_KEY|REVISIT_WINDOW|location\.hash/);
  assert.match(opening, /useModalFocus\(rootRef, visible && !reduced, finish\)/);
  assert.match(opening, /completed\.current\) return/);
  assert.match(opening, /classList\.remove\('intro-locked'\)/);
  assert.match(opening, /onClick=\{finish\}/);
  assert.match(source('src/components/opening.css'), /prefers-reduced-motion:reduce/);
});

test('source contract: About is employer-neutral and retains truthful authorship', () => {
  const about = source('src/components/AboutEditorial.tsx');
  assert.doesNotMatch(about, /腾讯|Tencent|微信读书/);
  assert.match(about, /AI Agent/);
  assert.match(about, /方案取舍、验收和后续维护/);
});
