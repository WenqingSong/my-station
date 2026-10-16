import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gsap } from 'gsap';
import { storyBeats, createStoryTween, stickySceneTop, offsetWithin } from '../src/scroll-story.ts';

for (const compact of [false, true]) {
  test(`${compact ? 'compact' : 'desktop'} story beats reverse to exactly the same scroll state`, () => {
    for (const [name, beat] of Object.entries(storyBeats(compact))) {
      const target = { ...beat.from };
      const tween = createStoryTween(target, name, compact);
      const read = () => Object.fromEntries(Object.keys(beat.from).map(key => [key, target[key]]));
      tween.progress(.35); const forward = read();
      tween.progress(1); tween.progress(.35); assert.deepEqual(read(), forward, name);
      tween.progress(1); assert.deepEqual(read(), beat.to, `${name} completes`);
      tween.kill();
    }
  });
  test(`${compact ? 'compact' : 'desktop'} pause reverts a partially expanded scene`, () => {
    const target = { y: 0, scale: 1 };
    const context = gsap.context(() => createStoryTween(target, 'handoff', compact).progress(.6));
    assert.ok(target.scale < 1);
    context.revert();
    assert.equal(target.scale, 1); assert.equal(target.y, 0);
  });
}

test('tall scenes scroll to their bottom before holding; small scenes never float down', () => {
  assert.equal(stickySceneTop(900, 1100), -200);
  assert.equal(stickySceneTop(900, 900), 0);
  assert.equal(stickySceneTop(900, 700), 0);
  assert.equal(stickySceneTop(600, 1100), -500);
});

test('local trigger offsets use layout coordinates, not transformed rectangles', () => {
  const scene = {offsetTop: 1000, offsetParent: null};
  const copy = {offsetTop: 80, offsetParent: scene};
  const title = {offsetTop: 25, offsetParent: copy};
  assert.equal(offsetWithin(title, scene), 105);
});

test('all scroll transforms scrub directly; no delayed or once-only lower-page entrances', () => {
  for (const file of ['SelectedWork', 'AboutEditorial', 'Contact']) {
    const src = readFileSync(new URL(`../src/components/${file}.tsx`, import.meta.url), 'utf8');
    assert.match(src, /scrub: true/);
    assert.doesNotMatch(src, /toggleActions|once: true|scrub: \d|setTimeout\([^)]*createStory/);
  }
  const css = readFileSync(new URL('../src/components/lower-page.css', import.meta.url), 'utf8');
  assert.match(css, /\.lower-work\.work-scroll \.work-scene\{position:sticky/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
