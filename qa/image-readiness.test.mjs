import test from 'node:test';
import assert from 'node:assert/strict';
import { observeImageReadiness } from '../src/image-readiness.ts';

class Picture extends EventTarget {
  complete = false;
  naturalWidth = 0;
  decodeCalls = 0;
  decode() { this.decodeCalls++; return this.decoding ?? Promise.resolve(); }
  loaded() { this.complete = true; this.naturalWidth = 960; this.dispatchEvent(new Event('load')); }
}
const tick = () => new Promise(setImmediate);

test('a pending DOM image keeps its cover even if a separate preload has completed', async () => {
  const image = new Picture(); let ready = 0;
  const cleanup = observeImageReadiness(image, () => ready++, assert.fail);
  await tick(); assert.equal(ready, 0); assert.equal(image.decodeCalls, 0);
  image.loaded(); await tick(); assert.equal(ready, 1);
  cleanup();
});

test('cover stays until the displayed image is decoded, not just downloaded', async () => {
  const image = new Picture(); let release, ready = 0;
  image.decoding = new Promise(resolve => { release = resolve; });
  const cleanup = observeImageReadiness(image, () => ready++, assert.fail);
  image.loaded(); await tick(); assert.equal(ready, 0);
  release(); await tick(); assert.equal(ready, 1);
  image.dispatchEvent(new Event('load')); await tick(); assert.equal(ready, 1);
  cleanup();
});

test('a cached DOM image still decodes before readiness', async () => {
  const image = new Picture(); image.complete = true; image.naturalWidth = 960;
  let ready = 0;
  const cleanup = observeImageReadiness(image, () => ready++, assert.fail);
  await tick(); assert.equal(ready, 1); assert.equal(image.decodeCalls, 1);
  cleanup();
});

test('switching away prevents the old image decode from changing the new view', async () => {
  const image = new Picture(); let release, ready = 0;
  image.decoding = new Promise(resolve => { release = resolve; });
  const cleanup = observeImageReadiness(image, () => ready++, assert.fail);
  image.loaded(); cleanup(); release(); await tick(); assert.equal(ready, 0);
});

test('actual resource errors and decode errors show the error state', async () => {
  for (const mode of ['network', 'decode']) {
    const image = new Picture(); let failed = 0;
    const cleanup = observeImageReadiness(image, assert.fail, () => failed++);
    if (mode === 'network') image.dispatchEvent(new Event('error'));
    else { image.decoding = Promise.reject(new Error('decode failed')); image.loaded(); }
    await tick(); assert.equal(failed, 1); cleanup();
  }
});
