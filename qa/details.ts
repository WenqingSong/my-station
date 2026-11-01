// Local, opt-in browser acceptance harness. Not a Vite production entry.
let reduced = false;
const originalMatchMedia = window.matchMedia.bind(window);
const motionQueries = new Set<MediaQueryList>();
window.matchMedia = query => {
  const result = originalMatchMedia(query);
  if (query.includes('prefers-reduced-motion')) {
    Object.defineProperty(result, 'matches', { get: () => reduced });
    motionQueries.add(result);
  }
  return result;
};

const toolbar = document.createElement('aside');
toolbar.setAttribute('aria-label', '本地验收控制');
toolbar.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:1000;display:flex;gap:8px;padding:8px;background:white;color:black;font:12px sans-serif;border:1px solid black';
const motionButton = document.createElement('button');
motionButton.textContent = '模拟系统减少动画';
motionButton.onclick = () => {
  reduced = !reduced;
  motionButton.setAttribute('aria-pressed', String(reduced));
  for (const query of motionQueries) query.dispatchEvent(new MediaQueryListEvent('change', { matches: reduced, media: query.media }));
};
const imageButton = document.createElement('button');
imageButton.textContent = '模拟照片失败';
imageButton.onclick = () => {
  const image = document.querySelector<HTMLImageElement>('.portrait-window img');
  if (!image) return;
  document.querySelectorAll('.portrait-window source').forEach(source => source.removeAttribute('srcset'));
  image.removeAttribute('srcset');
  image.src = '/qa/missing-portrait.webp';
};
toolbar.append(motionButton, imageButton);
document.body.append(toolbar);
await import('../src/main');
export {};
