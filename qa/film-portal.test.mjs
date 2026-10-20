import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nextPortalPhase, LandingGuard, canReturnToFilm, WheelIntent } from '../src/film-study/portal-policy.ts';

test('only complete film/Hero states can initiate travel; repeated/reverse inputs cannot queue', () => {
  assert.equal(nextPortalPhase('film', 'hero'), 'entering');
  assert.equal(nextPortalPhase('hero', 'film'), 'returning');
  for (const phase of ['entering', 'returning']) {
    assert.equal(nextPortalPhase(phase, 'film'), phase);
    assert.equal(nextPortalPhase(phase, 'hero'), phase);
  }
  assert.equal(nextPortalPhase('film', 'film'), 'film');
  assert.equal(nextPortalPhase('hero', 'hero'), 'hero');
});

test('ongoing trackpad inertia cannot scroll the newly landed Hero away from zero', () => {
  const guard = new LandingGuard();
  assert.equal(guard.consume(0), false);
  guard.start(10);
  for (let time = 20; time < 900; time += 20) assert.equal(guard.consume(time), true);
  guard.land(900);
  for (let time = 900; time <= 1500; time += 20) assert.equal(guard.consume(time), true);
  assert.equal(guard.consume(1750), false);
  assert.equal(guard.consume(1760), false);
});

test('a fresh scroll gesture after click-entry is not permanently locked', () => {
  const guard = new LandingGuard();
  guard.start(0); guard.land(860);
  assert.equal(guard.consume(1100), false);
});

test('upward momentum originating lower in Hero does not immediately return to film', () => {
  assert.equal(canReturnToFilm(100, false, -100), false);
  assert.equal(canReturnToFilm(0, false, -100), false);
  assert.equal(canReturnToFilm(0, true, -100), true);
  assert.equal(canReturnToFilm(0, true, 100), false);
  assert.equal(canReturnToFilm(0, true, -1), false);
});

test('slow trackpads, line wheels and page wheels reach a consistent intent threshold', () => {
  const intent = new WheelIntent();
  for (let i = 0; i < 11; i++) assert.equal(intent.add(1, 0, 900), 0);
  assert.equal(intent.add(1, 0, 900), 12);
  assert.equal(intent.add(-1, 0, 900), 0);
  assert.equal(intent.add(-11, 0, 900), -12);
  intent.reset();
  assert.equal(intent.add(1, 1, 900), 16);
  intent.reset();
  assert.equal(intent.add(-1, 2, 900), -900);
});

test('portal scopes scroll interception, restores state, protects media controls and aligns zero', () => {
  const hook = readFileSync(new URL('../src/film-study/useFilmPortal.ts', import.meta.url), 'utf8');
  for (const event of ['wheel', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'keydown', 'keyup', 'blur', 'resize', 'pageshow']) {
    assert.ok(hook.includes(`addEventListener('${event}'`));
    assert.ok(hook.includes(`removeEventListener('${event}'`));
  }
  assert.match(hook, /top: 0, left: 0, behavior: 'instant'/);
  assert.match(hook, /\.film-controls, \.film-review/);
  assert.match(hook, /if \(reduced\) \{ settle\(destination\); return; \}/);
  assert.match(hook, /history\.scrollRestoration = previousRestoration/);
  assert.match(hook, /if \(transitionKey === event.key\)/);
  assert.match(hook, /if \(touchConsumed \|\| current === 'entering'/);
  const css = readFileSync(new URL('../src/film-study/study.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /film-peek/);
  assert.match(css, /height:100dvh/);
  assert.match(css, /:has\(:focus-visible\)/);
  assert.match(css, /@media\(hover:none\),\(pointer:coarse\)/);
});
