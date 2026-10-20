import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portraitFocalPoint } from '../src/components/film/crop.ts';
import { verifyFilm } from '../scripts/verify-film.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const entry = read('src/components/film/FilmOpening.tsx');
const hook = read('src/components/film/useFilmPortal.ts');

test('actual root mounts film plus the complete site, not the old greeting or a demo', () => {
  assert.match(read('src/main.tsx'), /import App/);
  const app = read('src/App.tsx');
  for (const component of ['FilmOpening', 'FirstHero', 'SelectedWork', 'AboutEditorial', 'SiteDetails', 'JobsModal']) {
    assert.ok(app.includes(`<${component}`));
  }
  assert.doesNotMatch(app, /<Opening|import Opening/);
  assert.equal(existsSync(new URL('../src/components/Opening.tsx', import.meta.url)), false);
  assert.match(app, /onComplete|handleOpeningComplete/);
  assert.match(hook, /onEnteredRef\.current\(\)/);
  assert.doesNotMatch(entry, /film-study\/media|localStorage|sessionStorage|film-silent/);
});

test('original soundtrack is retained and every fresh visit starts muted', () => {
  assert.match(entry, /\[muted, setMuted\] = useState\(true\)/);
  assert.match(entry, /muted=\{muted\} playsInline loop/);
  assert.match(entry, /video\.defaultMuted = true; video\.muted = true/);
  assert.match(entry, /addEventListener\('pageshow', resetSound\)/);
  assert.equal((entry.match(/video\.muted = !video\.muted/g) || []).length, 1);
  assert.match(entry, /onClick=\{toggleSound\}/);
  assert.match(entry, /aria-label="影片声音" aria-pressed=\{!muted\}/);
  assert.match(entry, /onVolumeChange/);
});

test('hidden film pauses, reduced motion does not autoplay, failed media does not block entry', () => {
  assert.match(entry, /!active \|\| document.hidden/);
  assert.match(entry, /reduced && !explicitlyPlaying.current/);
  assert.match(entry, /explicitlyPlaying.current = true/);
  assert.match(entry, /onError=.*setFailed\(true\)/);
  assert.match(entry, /onClick=\{enterHero\}/);
  assert.doesNotMatch(entry, /autoPlay=/);
  assert.match(hook, /if \(reduced\) \{ settle\(destination\); return; \}/);
});

test('Lenis observes synchronous locking and ignores captured portal gestures', () => {
  const motion = read('src/motion.ts');
  assert.match(motion, /virtualScroll: \(\{ event \}\) => !event.defaultPrevented/);
  for (const event of ['film:lock', 'film:scroll-reset']) {
    assert.ok(hook.includes(`new Event('${event}')`));
    assert.ok(motion.includes(`addEventListener('${event}'`));
    assert.ok(motion.includes(`removeEventListener('${event}'`));
  }
  assert.match(hook, /passive: false, capture: true/);
  assert.match(motion, /scrollTo\(0, \{ immediate: true, force: true \}\)/);
  assert.match(hook, /if \(modalOpen\(\)\) return/);
  assert.match(hook, /event.key === 'Tab'/);
});

test('deployable media exactly matches original; missing files fail before building', () => {
  assert.ok(verifyFilm().filmBytes > 3_000_000);
  const temporary = mkdtempSync(join(tmpdir(), 'film-check-'));
  try {
    assert.throws(() => verifyFilm(pathToFileURL(temporary + '/')), /ENOENT/);
  } finally { rmSync(temporary, { recursive: true }); }
  assert.match(read('package.json'), /"prebuild": "node scripts\/verify-film.mjs"/);
  assert.match(read('Dockerfile'), /COPY --from=builder \/app\/dist/);
  assert.match(read('nginx.conf'), /location \/media\/ \{[\s\S]*?try_files \$uri =404/);
});

test('production dist contains film and poster, and the normal JS contains no greeting sequence', () => {
  // This suite is deliberately run AFTER npm run build, never silently skipped.
  assert.deepEqual(verifyFilm(new URL('../dist/media/', import.meta.url)), verifyFilm());
  const files = readdirSync(new URL('../dist/assets/', import.meta.url));
  const main = files.filter(file => /^main-.*\.js$/.test(file)).map(file => read('dist/assets/' + file)).join('');
  assert.ok(main.length > 1000);
  assert.match(main, /think-different\.mp4/);
  assert.doesNotMatch(main, /opening-greeting|opening-word|Bonjour|こんにちは/);
});

test('portrait framing changes at inspected shot boundaries and resets on looping', () => {
  for (const [time, focal] of [[1.674,20],[6,20],[7,50],[20,22],[22,50],[46,66],[48,60],[59,50],[0,20]]) {
    assert.equal(portraitFocalPoint(time), focal);
  }
});

test('About remains employer-neutral and retains the factual training entry', () => {
  const about = read('src/components/AboutEditorial.tsx');
  assert.doesNotMatch(about, /腾讯|Tencent|微信读书/);
  assert.match(about, /CNB-Docker 训练营 · 优秀学员/);
});
