import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../public/brand/intro.js', import.meta.url), 'utf8');
function harness({ animated = true, reduced = true, time = 5400, projectReturn = false } = {}) {
  const timers = new Map();
  const button = new EventTarget(); button.hidden = true; button.textContent = '先进入网站';
  const status = { textContent: '' };
  const root = { inert: true, removeAttribute() { this.inert = false; } };
  const overlay = { dataset: {}, removed: false, querySelector: tag => tag === 'button' ? button : {}, remove() { this.removed = true; } };
  let finishCount = 0, cancelCount = 0, release, finishOptions;
  const player = { currentTime: time, finish: options => { finishOptions = options; finishCount++; return new Promise(resolve => { release = resolve; }); }, cancel: () => { cancelCount++; } };
  const removedClasses = [], events = [];
  const context = vm.createContext({
    document: { hidden: true, getElementById: id => ({ 'brand-intro': overlay, root, 'brand-intro-status': status })[id], documentElement: { dataset: { projectReturn: projectReturn ? 'workflow' : undefined }, classList: { remove: name => removedClasses.push(name) } } },
    FrameworkMotion: animated ? { duration: 5400, create: () => player } : undefined,
    matchMedia: () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }),
    setTimeout: (fn, ms) => { timers.set(ms, fn); return ms; }, clearTimeout: id => timers.delete(id),
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    dispatchEvent: event => { events.push(event); context.onEvent?.(event); },
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

test('the slow-network action appears only after the application can accept it', () => {
  const h = harness();
  h.timers.get(8000)();
  assert.equal(h.button.hidden, true);
  h.context.FrameworkIntro.attachSite();
  assert.equal(h.button.hidden, false);
  assert.equal(h.button.textContent, '先进入网站');
  assert.equal(h.overlay.removed, false);
  assert.equal(h.counts().finishCount, 0);
});

test('the slow-network action does not interrupt a normal fast entrance', async () => {
  const h = harness(); h.context.FrameworkIntro.attachSite();
  assert.equal(h.button.hidden, true);
  const pending = h.context.FrameworkIntro.finish();
  await new Promise(setImmediate); h.release(); await pending;
  assert.equal(h.events[0].type, 'brand:ready');
});

test('manual continuation skips an unresolved media wait, exits once and targets the homepage', async () => {
  const h = harness(); h.context.FrameworkIntro.attachSite(); h.timers.get(8000)();
  h.button.dispatchEvent(new Event('click')); h.button.dispatchEvent(new Event('click'));
  await new Promise(setImmediate);
  assert.equal(h.events.filter(e => e.type === 'brand:continue').length, 1);
  assert.equal(h.counts().finishCount, 1);
  assert.equal(h.overlay.removed, false);
  assert.equal(h.button.disabled, true);
  h.release(); await h.context.FrameworkIntro.finish();
  assert.equal(h.overlay.removed, true);
  assert.equal(h.events[1].type, 'brand:ready');
});

test('manual continuation can interrupt an already pending video-frame handoff', async () => {
  const h = harness(); h.context.FrameworkIntro.attachSite();
  let rejectFrame;
  const pending = h.context.FrameworkIntro.finish(() => new Promise((resolve, reject) => { rejectFrame = reject; }));
  await new Promise(setImmediate);
  h.context.onEvent = event => { if (event.type === 'brand:continue') rejectFrame(new Error('cancelled playback')); };
  h.button.dispatchEvent(new Event('click'));
  await new Promise(setImmediate);
  assert.equal(h.counts().finishCount, 1);
  h.release(); await pending;
  assert.equal(h.overlay.removed, true);
  assert.equal(h.events.filter(e => e.type === 'brand:ready').length, 1);
});

test('a failed handoff can still be bypassed, without reloading or reviving the wait', async () => {
  const h = harness(); h.context.FrameworkIntro.attachSite();
  await assert.rejects(h.context.FrameworkIntro.finish(async () => { throw new Error('blocked'); }));
  h.context.FrameworkIntro.fail(); assert.equal(h.button.hidden, false);
  h.button.dispatchEvent(new Event('click'));
  await new Promise(setImmediate); h.release(); await h.context.FrameworkIntro.finish();
  assert.equal(h.overlay.removed, true);
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


test('returning from the project reader releases the site without preparing film or replaying the brand', () => {
  const h = harness({ projectReturn: true });
  assert.equal(h.overlay.removed, true);
  assert.equal(h.root.inert, false);
  assert.equal(h.context.FrameworkIntro, undefined);
  assert.equal(h.timers.size, 0);
  assert.equal(h.counts().finishCount, 0);
});
