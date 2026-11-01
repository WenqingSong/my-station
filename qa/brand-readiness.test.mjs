import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForMedia, waitForFilmFrame } from '../src/brand-readiness.ts';

class ImageStub extends EventTarget {
  complete = false;
  naturalWidth = 960;
  loading = 'lazy';
  decoded = false;
  async decode() { this.decoded = true; }
}
class VideoStub extends EventTarget {
  readyState = 0;
  error = null;
  preload = 'metadata';
}
globalThis.HTMLImageElement = ImageStub;
globalThis.HTMLVideoElement = VideoStub;

test('a cached image is decoded, and a below-fold image is requested immediately', async () => {
  const image = new ImageStub();
  image.complete = true;
  await waitForMedia(image, new AbortController().signal);
  assert.equal(image.loading, 'eager');
  assert.equal(image.decoded, true);
});

test('image readiness waits for the actual load and decode', async () => {
  const image = new ImageStub();
  let ready = false;
  const pending = waitForMedia(image, new AbortController().signal).then(() => { ready = true; });
  await Promise.resolve();
  assert.equal(ready, false);
  image.dispatchEvent(new Event('load'));
  await pending;
  assert.equal(image.decoded, true);
});

test('video readiness waits for canplay rather than metadata or full download', async () => {
  const video = new VideoStub();
  let ready = false;
  const pending = waitForMedia(video, new AbortController().signal).then(() => { ready = true; });
  video.dispatchEvent(new Event('loadedmetadata'));
  await Promise.resolve();
  assert.equal(ready, false);
  assert.equal(video.preload, 'auto');
  video.dispatchEvent(new Event('canplay'));
  await pending;
  assert.equal(ready, true);
});

test('failed media rejects readiness; cancellation only releases the pending wait', async () => {
  const broken = new VideoStub();
  const failed = waitForMedia(broken, new AbortController().signal);
  broken.dispatchEvent(new Event('error'));
  await assert.rejects(failed, /媒体加载失败/);
  const controller = new AbortController();
  const image = new ImageStub();
  const stalled = waitForMedia(image, controller.signal);
  controller.abort();
  await stalled;
  assert.equal(image.decoded, false);
});

test('playable metadata does not count as a presented film frame', async () => {
  const video = new VideoStub();
  video.readyState = 4; video.currentTime = 0; video.paused = true;
  video.play = async () => { video.paused = false; };
  let ready = false;
  const pending = waitForFilmFrame(video, new AbortController().signal).then(() => { ready = true; });
  video.currentTime = 1;
  video.dispatchEvent(new Event('timeupdate'));
  await Promise.resolve(); assert.equal(ready, false);
  video.currentTime = 1.7;
  video.dispatchEvent(new Event('timeupdate'));
  await pending; assert.equal(ready, true);
});

test('native presented-frame callback gates reveal on the meaningful shot', async () => {
  const video = new VideoStub();
  video.paused = true;
  video.play = async () => { video.paused = false; };
  let callback, ready = false;
  video.requestVideoFrameCallback = fn => { callback = fn; return 1; };
  video.cancelVideoFrameCallback = () => {};
  const pending = waitForFilmFrame(video, new AbortController().signal).then(() => { ready = true; });
  callback(0, { mediaTime: .5 });
  await Promise.resolve(); assert.equal(ready, false);
  callback(0, { mediaTime: 1.7 });
  await pending; assert.equal(ready, true);
});

test('autoplay refusal rejects the handoff instead of revealing a frozen poster', async () => {
  const video = new VideoStub();
  video.play = async () => { throw new Error('autoplay refused'); };
  await assert.rejects(waitForFilmFrame(video, new AbortController().signal), /autoplay refused/);
});
