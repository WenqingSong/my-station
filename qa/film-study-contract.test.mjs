import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portraitFocalPoint } from '../src/film-study/crop.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const entry = read('src/film-study/main.tsx');

test('film study keeps the original audio and starts every mount muted', () => {
  assert.match(entry, /const source = 'original'/);
  assert.match(entry, /\[muted, setMuted\] = useState\(true\)/);
  assert.match(entry, /muted=\{muted\} playsInline loop/);
  assert.match(entry, /video\.defaultMuted = true; video\.muted = true/);
  assert.match(entry, /addEventListener\('pageshow', resetSound\)/);
  assert.doesNotMatch(entry, /localStorage|sessionStorage|film-silent/);
});

test('sound opt-in is a dedicated accessible control', () => {
  assert.match(entry, /onClick=\{toggleSound\}/);
  assert.match(entry, /aria-label="影片声音" aria-pressed=\{!muted\}/);
  assert.equal((entry.match(/video\.muted = !video\.muted/g) || []).length, 1);
  assert.match(entry, /onVolumeChange/);
});

test('study reuses Hero, but does not mount or replace the main app/opening', () => {
  assert.match(entry, /import FirstHero/);
  assert.doesNotMatch(entry, /import.*(?:Opening|App|gsap|lenis)/);
  assert.doesNotMatch(read('src/main.tsx'), /film-study/);
  assert.doesNotMatch(read('vite.config.ts'), /film-study/);
  assert.match(read('film-study/index.html'), /noindex, nofollow/);
});

test('media stays local and out of ordinary production assets', () => {
  assert.match(read('.gitignore'), /film-study\/media\//);
  const dist = new URL('../dist/', import.meta.url);
  if (existsSync(dist)) {
    const paths = readdirSync(dist, { recursive: true });
    assert.ok(!paths.some(path => /film-study|original\.mp4|film-silent\.mp4/.test(path)));
  }
});

test('portrait framing changes only at inspected shot ranges and resets on looping', () => {
  assert.equal(portraitFocalPoint(1.674), 20);
  assert.equal(portraitFocalPoint(6), 20);
  assert.equal(portraitFocalPoint(7), 50);
  assert.equal(portraitFocalPoint(20), 22);
  assert.equal(portraitFocalPoint(22), 50);
  assert.equal(portraitFocalPoint(46), 66);
  assert.equal(portraitFocalPoint(48), 60);
  assert.equal(portraitFocalPoint(59), 50);
  assert.equal(portraitFocalPoint(0), 20);
});
