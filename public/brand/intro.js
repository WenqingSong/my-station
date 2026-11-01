// The original Framework v13 player owns its geometry and withdrawal animation.
(() => {
  const overlay = document.getElementById('brand-intro');
  if (!overlay) return;
  const root = document.getElementById('root');
  const svg = overlay.querySelector('svg');
  const button = overlay.querySelector('button');
  const status = document.getElementById('brand-intro-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let player, finishing;
  try { player = globalThis.FrameworkMotion?.create(svg, { loop: true }); }
  catch { /* Keep the static official mark if the animation runtime is unavailable. */ }

  // v12's first complete formation / hold / withdrawal cycle lasts 5400 ms.
  // Read the player's clock so a fast cache never cuts the first cycle short.
  const firstCycle = () => new Promise(resolve => {
    const check = () => {
      if (!player || reduced.matches || player.currentTime >= (globalThis.FrameworkMotion.duration ?? 5400)) resolve();
      else setTimeout(check, Math.max(16, (globalThis.FrameworkMotion.duration ?? 5400) - player.currentTime));
    };
    check();
  });
  const fail = (message = '影片暂时无法播放，请重新加载') => {
    status.textContent = message;
    button.textContent = '重新加载';
    button.hidden = false;
  };
  async function finish(beforeReveal) {
    if (finishing) return finishing;
    finishing = (async () => {
      await firstCycle();
      // Prepare real playback under the opaque cover, before withdrawing it.
      await beforeReveal?.();
      if (player) await player.finish({ surface: overlay });
      else if (!reduced.matches && !document.hidden) {
        await overlay.animate(
          [{ filter: 'blur(0px)', opacity: 1 }, { filter: 'blur(14px)', opacity: 0 }],
          { duration: 640, easing: 'ease-in-out', fill: 'forwards' },
        ).finished;
      }
      clearTimeout(slowTimer); clearTimeout(deadline);
      reduced.removeEventListener('change', updateMotion);
      button.hidden = true;
      overlay.remove();
      player?.cancel();
      document.documentElement.classList.remove('brand-loading');
      root?.removeAttribute('inert');
      globalThis.dispatchEvent(new CustomEvent('brand:ready'));
    })();
    return finishing;
  }
  const slowTimer = setTimeout(() => { status.textContent = '正在准备影片与播放控制'; }, 6000);
  // A timeout offers retry, never exposes a video that is not ready.
  const deadline = setTimeout(() => fail('影片加载较慢，正在继续等待，也可以重新加载'), 15000);
  button.addEventListener('click', () => location.reload());
  const updateMotion = () => {
    if (finishing) return;
    player?.cancel();
    player = globalThis.FrameworkMotion?.create(svg, { loop: true });
  };
  reduced.addEventListener('change', updateMotion);
  globalThis.FrameworkIntro = { finish, fail };
})();
