import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../public/brand/intro.js', import.meta.url), 'utf8');
function harness({ animated = true, reduced = true, time = 5400 } = {}) {
  const timers = new Map();
  const button = new EventTarget(); button.hidden = true;
  const status = { textContent: '' };
  const root = { inert: true, removeAttribute() { this.inert = false; } };
  const overlay = { dataset: {}, removed: false, querySelector: tag => tag === 'button' ? button : {}, remove() { this.removed = true; } };
  let finishCount = 0, cancelCount = 0, release, finishOptions;
  const player = { currentTime: time, finish: options => { finishOptions = options; finishCount++; return new Promise(resolve => { release = resolve; }); }, cancel: () => { cancelCount++; } };
  const removedClasses = [], events = [];
  const context = vm.createContext({
    document: { hidden: true, getElementById: id => ({ 'brand-intro': overlay, root, 'brand-intro-status': status })[id], documentElement: { classList: { remove: name => removedClasses.push(name) } } },
    FrameworkMotion: animated ? { duration: 5400, create: () => player } : undefined,
    matchMedia: () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }),
    setTimeout: (fn, ms) => { timers.set(ms, fn); return ms; }, clearTimeout: id => timers.delete(id),
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    dispatchEvent: event => events.push(event),
  });
  vm.runInContext(script, context);
  return { context, overlay, root, button, status, timers, events, removedClasses,
    player, options: () => finishOptions, release: () => release(), counts: () => ({ finishCount, cancelCount }) };
}

test('entrance stays covered until the original animation finishes withdrawing', async () => {
  const h = harness();
  const a = h.context.FrameworkIntro.finish();
  const b = h.context.FrameworkIntro.finish();
  await new Promise(setImmediate);
  assert.equal(h.overlay.removed, false);
  assert.equal(h.root.inert, true);
  assert.equal(h.counts().finishCount, 1);
  assert.equal(h.options().surface, h.overlay);
  h.release(); await Promise.all([a, b]);
  assert.equal(h.overlay.removed, true);
  assert.equal(h.root.inert, false);
  assert.deepEqual(h.removedClasses, ['brand-loading']);
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].type, 'brand:ready');
  assert.equal(h.timers.size, 0);
});

test('fast cached media cannot truncate the first full animation cycle', async () => {
  const h = harness({ reduced: false, time: 0 });
  let prepared = false;
  const pending = h.context.FrameworkIntro.finish(async () => { prepared = true; });
  await new Promise(setImmediate);
  assert.equal(prepared, false);
  assert.equal(h.counts().finishCount, 0);
  h.player.currentTime = 5399;
  h.timers.get(5400)();
  await new Promise(setImmediate);
  assert.equal(prepared, false);
  h.player.currentTime = 5400;
  h.timers.get(16)();
  await new Promise(setImmediate);
  assert.equal(prepared, true);
  assert.equal(h.counts().finishCount, 1);
  h.release(); await pending;
});

test('animation withdrawal waits for actual film preparation', async () => {
  const h = harness();
  let allowFrame;
  const pending = h.context.FrameworkIntro.finish(() => new Promise(resolve => { allowFrame = resolve; }));
  await new Promise(setImmediate);
  assert.equal(h.counts().finishCount, 0);
  assert.equal(h.overlay.removed, false);
  allowFrame(); await new Promise(setImmediate);
  assert.equal(h.counts().finishCount, 1);
  h.release(); await pending;
});

test('a slow network offers retry without automatically exposing unready video', () => {
  const h = harness();
  h.timers.get(6000)();
  assert.equal(h.button.hidden, true);
  h.timers.get(15000)();
  assert.equal(h.button.hidden, false);
  assert.equal(h.button.textContent, '重新加载');
  assert.equal(h.overlay.removed, false);
  assert.equal(h.counts().finishCount, 0);
});

test('a failed playback preparation leaves the brand cover in place', async () => {
  const h = harness();
  await assert.rejects(h.context.FrameworkIntro.finish(async () => { throw new Error('blocked'); }));
  assert.equal(h.overlay.removed, false);
  assert.equal(h.counts().finishCount, 0);
});

test('a failed animation runtime still releases the static brand fallback', async () => {
  const h = harness({ animated: false });
  await h.context.FrameworkIntro.finish();
  assert.equal(h.overlay.removed, true);
  assert.equal(h.root.inert, false);
});
