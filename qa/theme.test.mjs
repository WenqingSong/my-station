import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/brand/theme.js', import.meta.url), 'utf8');
function boot({ saved, dark = false, blocked = false } = {}) {
  const events = new Map();
  const system = { matches: dark, addEventListener(_, callback) { this.change = callback; } };
  const root = { dataset: {}, style: {} };
  const meta = { removeAttribute() {}, content: '' };
  const context = {
    matchMedia: () => system,
    localStorage: { getItem() { if (blocked) throw Error('denied'); return saved; } },
    document: { documentElement: root, querySelectorAll: () => [meta] },
    Event: class { constructor(type) { this.type = type; } },
    window: {
      addEventListener(type, callback) { events.set(type, callback); },
      dispatchEvent(event) { events.get(event.type)?.(event); },
    },
  };
  vm.runInNewContext(source, context);
  return { root, system, meta, events, save(value) { saved = value; } };
}
test('appearance follows system until an explicit preference is saved', () => {
  const page = boot({ dark: true });
  assert.equal(page.root.dataset.theme, 'dark');
  page.system.matches = false; page.system.change();
  assert.equal(page.root.dataset.theme, 'light');
  page.save('dark'); page.system.change();
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(page.meta.content, '#14171c');
  page.save(null); page.events.get('storage')({ key: 'arthur-theme' });
  assert.equal(page.root.dataset.theme, 'light');
});
test('saved light overrides dark system; unavailable or invalid storage falls back to system', () => {
  assert.equal(boot({ saved: 'light', dark: true }).root.dataset.theme, 'light');
  assert.equal(boot({ blocked: true, dark: true }).root.dataset.theme, 'dark');
  assert.equal(boot({ saved: 'unknown', dark: true }).root.dataset.theme, 'dark');
});
