import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { captureReadingPoint, restoreReadingPoint } from '../src/reading-position.ts';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const desktop = [{ id: 'top', top: 0, height: 900 }, { id: 'about', top: 6000, height: 1800 }, { id: 'contact', top: 7800, height: 1200 }];
const phone = [{ id: 'top', top: 0, height: 1100 }, { id: 'about', top: 8000, height: 2400 }, { id: 'contact', top: 10400, height: 1000 }];

test('changing responsive layout preserves the same chapter and reading fraction', () => {
  const point = captureReadingPoint(desktop, 6450);
  assert.deepEqual(point, { id: 'about', progress: .25 });
  assert.equal(restoreReadingPoint(point, phone, 76), 8524);
  assert.deepEqual(captureReadingPoint(phone, 8600), point);
});

test('top, sticky hold gaps, missing targets and zero-height regions are bounded', () => {
  assert.equal(captureReadingPoint([], 0), null);
  assert.equal(captureReadingPoint(desktop, -1), null);
  assert.deepEqual(captureReadingPoint(desktop, 1300), { id: 'top', progress: 1 });
  assert.equal(restoreReadingPoint({ id: 'top', progress: 0 }, phone, 76), 0);
  assert.equal(restoreReadingPoint({ id: 'missing', progress: .5 }, phone, 76), null);
  assert.deepEqual(captureReadingPoint([{ id: 'empty', top: 0, height: 0 }], 2), { id: 'empty', progress: 1 });
});

test('motion preference changes do not reinitialize the film or send readers to zero', () => {
  const portal = read('src/components/film/useFilmPortal.ts');
  assert.match(portal, /\}, \[heroRef, stageRef\]\)/);
  assert.match(portal, /if \(reduced\) finishTransitionRef.current\(\)/);
  assert.match(portal, /if \(align\) alignTop\(\)/);
  assert.match(portal, /event.persisted && phaseRef.current === 'hero'/);
  assert.match(portal, /settle\('hero', false, false\)/);
});

test('anchors use normal-flow markers and the actual navigation height', () => {
  const navigation = read('src/navigation.ts');
  assert.match(navigation, /previousElementSibling/);
  assert.match(navigation, /work-flow-marker/);
  assert.match(navigation, /getBoundingClientRect\(\).bottom \+ 12/);
  assert.match(navigation, /decodeURIComponent/);
  assert.match(read('src/motion.ts'), /site:scroll-restore/);
  assert.match(read('src/useReadingPosition.ts'), /removeEventListener\('resize', resize\)/);
});

test('images reserve their crop, decode before display and retain sharp original sources', () => {
  const about = read('src/components/AboutEditorial.tsx');
  assert.match(about, /await image.decode\(\)/);
  assert.match(about, /if \(image.complete\)/);
  assert.match(about, /width="960" height="1440"/);
  assert.match(about, /arthur-editorial-2160.webp 2160w/);
  assert.match(about, /data-image-state=\{imageState\}/);
  assert.match(about, /照片暂未载入/);
  const css = read('src/components/about-editorial.css');
  assert.match(css, /aspect-ratio:4\/5/);
  assert.match(css, /filter:none;opacity:1/);
});

test('font loading never causes an unlimited late swap; no new font downloads', () => {
  const styles = read('src/styles.css') + read('src/components/first-hero.css');
  assert.equal((styles.match(/font-display:optional/g) || []).length, 3);
  assert.doesNotMatch(styles, /font-display:swap|fonts.googleapis/);
  assert.equal((read('index.html').match(/rel="preload"[^>]*as="font"/g) || []).length, 3);
});

test('polish does not disable scrolling animation or add transform filters to photos', () => {
  const css = read('src/detail-polish.css');
  assert.doesNotMatch(css, /work-linear|work-still|animation:none|scrub|filter:blur/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /film-enter:active \{ scale: 1/);
  assert.match(css, /focus-visible/);
});
