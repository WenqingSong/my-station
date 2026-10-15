import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fragmentId, navigationDuration, navigationOffset } from '../src/navigation.ts';
import { copyEmail } from '../src/components/copy-contact.ts';
const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('anchor fragments decode safely without selector injection or malformed URI errors', () => {
  assert.equal(fragmentId('#work-backend'), 'work-backend');
  assert.equal(fragmentId('#%E4%BD%A0%E5%A5%BD'), '你好');
  assert.equal(fragmentId('#%E0%A4%A'), '');
});
test('offset follows header height, with a safe short-viewport bound', () => {
  assert.equal(navigationOffset(64, 844), 80);
  assert.equal(navigationOffset(70.2, 900), 87);
  assert.equal(navigationOffset(400, 300), 120);
});
test('short jumps do not take as long as full-page returns', () => {
  assert.equal(navigationDuration(0, 800), .35);
  assert.equal(navigationDuration(9000, 800), 1.15);
  assert.equal(navigationDuration(-800, 800), navigationDuration(800, 800));
});
test('a clipboard permission prompt cannot strand the copy button', async () => {
  let finish;
  const result = copyEmail({writeText: () => new Promise(resolve => { finish = resolve; })}, 5);
  assert.equal(await result, 'manual');
  finish();
  assert.equal(await result, 'manual', 'late success must not replace fallback');
});
test('motion cancels destinations on input and retargets only active jumps on resize', () => {
  const motion = source('src/motion.ts');
  assert.match(motion, /addEventListener\('wheel', stopNavigation, \{ passive: true, capture: true \}\)/);
  assert.match(motion, /removeEventListener\('wheel', stopNavigation, true\)/);
  assert.match(motion, /if \(destination.current\) travel\(destination.current, true\)/);
  assert.match(motion, /initialNavigation.current && location.hash/);
  assert.match(motion, /stopInertiaOnNavigate: false/);
  assert.match(motion, /lenis\.stop\(\); if \(!locked\) lenis\.start\(\)/);
  assert.match(motion, /history\.scrollRestoration = 'manual'/);
  assert.match(motion, /history\.scrollRestoration = previousRestoration/);
});
test('focus restoration skips hidden desktop branding', () => {
  const focus = source('src/useModalFocus.ts');
  assert.match(focus, /getClientRects\(\).length > 0/);
  assert.match(focus, /\.brand, \.site-header nav a/);
});
test('image reserves geometry, handles failure and shares responsive sizes', () => {
  const about = source('src/components/AboutEditorial.tsx');
  assert.match(about, /data-image-state=\{portraitState\}/);
  assert.match(about, /onError=\{\(\) => setPortraitState\('error'\)\}/);
  assert.equal((about.match(/sizes=\{portraitSizes\}/g) || []).length, 2);
  assert.match(source('src/components/interaction-finish.css'), /aspect-ratio:4\/5/);
});
test('late page fonts do not swap, while the opening keeps its independent font gate', () => {
  for (const file of ['src/styles.css', 'src/components/first-hero.css', 'src/components/lower-page.css']) {
    assert.doesNotMatch(source(file), /font-display:swap/);
    assert.match(source(file), /font-display:optional/);
  }
  assert.match(source('src/components/Opening.tsx'), /root.dataset.font = loaded \? 'custom' : 'system'/);
});
