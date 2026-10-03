// Development-only diagnostics: Vite's production entry remains index.html.
const params = new URLSearchParams(location.search);
if (params.get('motion') === 'reduce') {
  const original = window.matchMedia.bind(window);
  window.matchMedia = query => {
    const result = original(query);
    if (query.includes('prefers-reduced-motion')) Object.defineProperty(result, 'matches', { value: true });
    return result;
  };
}
if (params.get('entry') === 'jobs') history.replaceState(null, '', '/jobs');
const readout = document.createElement('output');
readout.id = 'qa-readout'; readout.hidden = true; document.body.append(readout);
const frames: number[] = []; const tasks: number[] = []; let cls = 0; let last = 0; let since = 0;
const started = performance.now(); let fontsReady = 0;
const observers: PerformanceObserver[] = [];
for (const type of ['longtask', 'layout-shift']) {
  if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
  const observer = new PerformanceObserver(list => list.getEntries().forEach(entry => {
    if (type === 'longtask') tasks.push(entry.duration);
    else if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) cls += (entry as PerformanceEntry & { value: number }).value;
  }));
  observer.observe({ type, buffered: true }); observers.push(observer);
}
const frame = (now: number) => {
  if (last && !document.hidden) frames.push(now - last);
  last = now;
  if (now - since > 1000) {
    const sorted = [...frames].sort((a,b) => a-b);
    readout.textContent = JSON.stringify({frames:frames.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],over50:frames.filter(n=>n>50).length,longTasks:tasks.length,maxTask:Math.max(0,...tasks),cls,fontsReady,fonts:document.fonts.status,dpr:devicePixelRatio,supported:PerformanceObserver.supportedEntryTypes}); since=now;
  }
  if (now - started < 120000) requestAnimationFrame(frame);
  else observers.forEach(observer => observer.disconnect());
};
document.addEventListener('visibilitychange',()=>{last=0;});
requestAnimationFrame(frame);
await import('../src/main');
document.fonts.ready.then(()=>{fontsReady=performance.now()-started;});
export {};
