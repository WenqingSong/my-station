// Readiness means decoded pictures and a playable buffer, then an actual video
// frame and mounted controls before the opaque brand cover may withdraw.
export function waitForMedia(element: HTMLImageElement | HTMLVideoElement, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const video = element instanceof HTMLVideoElement;
    const events = video ? ['canplay', 'error'] : ['load', 'error'];
    const done = (event?: Event) => {
      if (settled) return;
      settled = true;
      events.forEach(name => element.removeEventListener(name, done));
      signal.removeEventListener('abort', done);
      if (!signal.aborted && (event?.type === 'error' || (video && (element as HTMLVideoElement).error))) reject(new Error('媒体加载失败'));
      else resolve();
    };
    events.forEach(event => element.addEventListener(event, done, { once: true }));
    signal.addEventListener('abort', done, { once: true });
    if (signal.aborted) { done(); return; }
    if (video) {
      const media = element as HTMLVideoElement;
      if (media.readyState >= 3 || media.error) done();
      else media.preload = 'auto';
    } else {
      const image = element as HTMLImageElement;
      image.loading = 'eager';
      if (image.complete) done(image.naturalWidth ? undefined : new Event('error'));
    }
  }).then(async () => {
    if (!signal.aborted && element instanceof HTMLImageElement && element.naturalWidth > 0) await element.decode();
  });
}

export function waitForFilmFrame(video: HTMLVideoElement, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let frame = 0, settled = false;
    const done = (error?: Error) => {
      if (settled) return;
      settled = true;
      if (frame) video.cancelVideoFrameCallback(frame);
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('error', failed);
      signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve();
    };
    // The source starts with a dark leader. Retain its original timeline under
    // the cover; reveal only once the first meaningful shot is being rendered.
    const update = () => { if (video.currentTime >= 1.674 && video.readyState >= 2 && !video.paused) done(); };
    const onFrame: VideoFrameRequestCallback = (_, metadata) => {
      frame = 0;
      if (metadata.mediaTime >= 1.674 && !video.paused) done();
      else if (!settled) frame = video.requestVideoFrameCallback(onFrame);
    };
    const failed = () => done(new Error('影片无法播放'));
    const abort = () => done(new DOMException('已取消', 'AbortError'));
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    video.addEventListener('error', failed, { once: true });
    if (typeof video.requestVideoFrameCallback === 'function') frame = video.requestVideoFrameCallback(onFrame);
    else { video.addEventListener('timeupdate', update); update(); }
    // Register frame listeners before play(), including cached playback.
    void video.play().catch(error => done(error));
  });
}

const paint = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
export async function prepareFilmHandoff(video: HTMLVideoElement, signal: AbortSignal) {
  const stage = video.closest<HTMLElement>('.film-stage');
  const controls = stage?.querySelectorAll<HTMLButtonElement>('.film-enter, .film-sound, .film-playback');
  if (!stage || controls?.length !== 3 || [...controls].some(button => button.disabled)) throw new Error('播放控制尚未准备好');
  await document.fonts.ready;
  if (signal.aborted) return;
  // Respect reduced motion: show the decoded poster and usable play control.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stage.dataset.filmStarting = 'true';
    try { await waitForFilmFrame(video, signal); }
    catch (error) { delete stage.dataset.filmStarting; video.pause(); throw error; }
  }
  if (signal.aborted) return;
  stage.dataset.introReady = 'true';
  await paint();
  await paint();
  if ([...controls].some(button => !button.getBoundingClientRect().width)) throw new Error('播放控制尚未完成布局');
}

declare global {
  interface Window { FrameworkIntro?: { finish(beforeReveal?: () => Promise<void>): Promise<void>; fail(message?: string): void }; }
}

export async function prepareBrandEntrance(signal: AbortSignal) {
  try {
    const media = [...document.querySelectorAll<HTMLImageElement | HTMLVideoElement>('#root img, #root video')];
    await Promise.all(media.map(element => waitForMedia(element, signal)));
    if (signal.aborted) return;
    const video = document.querySelector<HTMLVideoElement>('.film-video');
    if (!video) throw new Error('影片尚未准备好');
    const handoff = () => prepareFilmHandoff(video, signal);
    if (window.FrameworkIntro) await window.FrameworkIntro.finish(handoff);
    else {
      await handoff();
      if (signal.aborted) return;
      document.getElementById('brand-intro')?.remove();
      document.getElementById('root')?.removeAttribute('inert');
      document.documentElement.classList.remove('brand-loading');
      window.dispatchEvent(new CustomEvent('brand:ready'));
    }
  } catch {
    if (!signal.aborted) {
      if (window.FrameworkIntro) window.FrameworkIntro.fail();
      else {
        const status = document.getElementById('brand-intro-status');
        if (status) status.textContent = '影片暂时无法播放，请刷新页面重试';
      }
    }
  }
}
