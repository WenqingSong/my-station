// Apply before first paint so a saved preference also colors the opening.
(() => {
  const system = matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    let saved;
    try { saved = localStorage.getItem('arthur-theme'); } catch { /* Use system preference. */ }
    const theme = saved === 'light' || saved === 'dark' ? saved : system.matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.removeAttribute('media');
      meta.content = theme === 'dark' ? '#14171c' : '#f1efe9';
    });
    window.dispatchEvent(new Event('site:theme'));
  };
  system.addEventListener('change', apply);
  window.addEventListener('storage', event => { if (event.key === 'arthur-theme' || event.key === null) apply(); });
  window.addEventListener('site:theme', () => {
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.removeAttribute('media');
      meta.content = document.documentElement.dataset.theme === 'dark' ? '#14171c' : '#f1efe9';
    });
  });
  apply();
})();
