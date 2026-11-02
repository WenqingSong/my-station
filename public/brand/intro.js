// The original Framework v13 player owns its geometry and withdrawal animation.
(() => {
  const overlay = document.getElementById('brand-intro');
  if (!overlay) return;
  const root = document.getElementById('root');
  if (document.documentElement.dataset?.projectReturn === 'workflow') {
    overlay.remove(); root?.removeAttribute('inert'); return;
  }
  const svg = overlay.querySelector('svg');
  const button = overlay.querySelector('button');
  const status = document.getElementById('brand-intro-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let player, finishing, resolveSkip, cycleTimer;
  button.hidden = false;
  let siteAvailable = false, slow = false, skipping = false, exiting = false, pendingContinue = false;
  const skipRequested = new Promise(resolve => { resolveSkip = resolve; });
  try { player = globalThis.FrameworkMotion?.create(svg, { loop: true }); }
  catch { /* Keep the static official mark if the animation runtime is unavailable. */ }

  // v12's first complete formation / hold / withdrawal cycle lasts 5400 ms.
  // Read the player's clock so a fast cache never cuts the first cycle short.
  const firstCycle = () => new Promise(resolve => {
    const check = () => {
      if (skipping || exiting || !player || reduced.matches || player.currentTime >= (globalThis.FrameworkMotion.duration ?? 5400)) resolve();
      else cycleTimer = setTimeout(check, Math.max(16, (globalThis.FrameworkMotion.duration ?? 5400) - player.currentTime));
    };
    check();
  });
  const fail = (message = '影片暂未准备好，可以先浏览网站') => {
    if (skipping || exiting) return;
    status.textContent = message;
    slow = true;
    button.hidden = !siteAvailable;
  };
  async function finish(beforeReveal) {
    if (finishing) return finishing;
    finishing = (async () => {
      await Promise.race([firstCycle(), skipRequested]);
      // Prepare real playback under the opaque cover, before withdrawing it.
      if (!skipping) await Promise.race([Promise.resolve().then(() => beforeReveal?.()), skipRequested]);
      exiting = true;
      button.disabled = true;
      clearTimeout(slowTimer); clearTimeout(deadline); clearTimeout(cycleTimer);
      if (player) await player.finish({ surface: overlay });
      else if (!reduced.matches && !document.hidden) {
        await overlay.animate(
          [{ filter: 'blur(0px)', opacity: 1 }, { filter: 'blur(14px)', opacity: 0 }],
          { duration: 640, easing: 'ease-in-out', fill: 'forwards' },
        ).finished;
      }
      reduced.removeEventListener('change', updateMotion);
      button.hidden = true;
      overlay.remove();
      player?.cancel();
      document.documentElement.classList.remove('brand-loading');
      root?.removeAttribute('inert');
      globalThis.dispatchEvent(new CustomEvent('brand:ready'));
    })().catch(error => { finishing = undefined; throw error; });
    return finishing;
  }
  const showSlow = () => {
    if (skipping || exiting) return;
    slow = true;
    status.textContent = siteAvailable ? '影片还在准备，可以先浏览网站' : '网站仍在准备，请稍候';
    button.hidden = !siteAvailable;
  };
  // Leave room for the full brand cycle and normal film handoff, so a warm
  // cache does not briefly flash a slow-network action during its usual exit.
  const slowTimer = setTimeout(showSlow, 8000);
  const deadline = setTimeout(showSlow, 15000);
  const continueToSite = () => {
    if (skipping || exiting) return;
    if (!siteAvailable) { pendingContinue = true; button.disabled = true; status.textContent = '正在进入主页…'; return; }
    skipping = true;
    button.disabled = true;
    button.textContent = '正在进入…';
    clearTimeout(slowTimer); clearTimeout(deadline); clearTimeout(cycleTimer);
    // Resolve before aborting film preparation, so that its cancellation cannot
    // reject the handoff that the visitor has explicitly chosen to bypass.
    resolveSkip();
    globalThis.dispatchEvent(new CustomEvent('brand:continue'));
    void finish().catch(() => fail());
  };
  button.addEventListener('click', continueToSite);
  const updateMotion = () => {
    if (finishing) return;
    player?.cancel();
    player = globalThis.FrameworkMotion?.create(svg, { loop: true });
  };
  reduced.addEventListener('change', updateMotion);
  globalThis.FrameworkIntro = { finish, fail, attachSite() { siteAvailable = true; if (pendingContinue) continueToSite(); else button.hidden = false; } };
})();
