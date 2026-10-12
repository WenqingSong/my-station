import { useEffect, useRef } from 'react';

type Props = { paused: boolean; motionDisabled: boolean; reduced: boolean; toggleMotion: () => void };

// The original 977e768 field and pointer response, with an idle/offscreen RAF guard.
export default function FirstHero({ paused, motionDisabled, reduced, toggleMotion }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!host || !canvas || !ctx) return;
    let points: { x: number; y: number; ox: number; oy: number; radius: number }[] = [];
    let width = 0, height = 0, frame = 0;
    let onscreen = true;
    let pointer = { x: -999, y: -999 };
    let layoutPointer: { x: number; y: number } | null = null;
    const lines = host.querySelectorAll<HTMLElement>('.first-pressure-line');
    const floaters = host.querySelectorAll<HTMLElement>('.first-floating-window');
    const resetLayers = () => {
      lines.forEach(line => { line.style.removeProperty('transform'); line.style.removeProperty('letter-spacing'); });
      floaters.forEach(floater => floater.style.removeProperty('transform'));
    };
    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const step = width < 700 ? 42 : 34;
      points = [];
      for (let y = step; y < height; y += step) for (let x = step; x < width; x += step) points.push({ x, y, ox: x, oy: y, radius: 1 });
    };
    const draw = () => {
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(16,16,16,.28)';
      let moving = false;
      points.forEach(point => {
        const dx = point.ox - pointer.x, dy = point.oy - pointer.y;
        const distance = Math.hypot(dx, dy);
        const force = paused ? 0 : Math.max(0, 1 - distance / 180);
        const angle = Math.atan2(dy, dx);
        const tx = point.ox + Math.cos(angle) * force * 28;
        const ty = point.oy + Math.sin(angle) * force * 28;
        const radius = 1 + force * 3;
        point.x += (tx - point.x) * .12;
        point.y += (ty - point.y) * .12;
        point.radius += (radius - point.radius) * .12;
        if (Math.abs(tx - point.x) + Math.abs(ty - point.y) + Math.abs(radius - point.radius) > .025) moving = true;
        ctx.beginPath(); ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2); ctx.fill();
      });
      if (layoutPointer && !paused) {
        const { x, y } = layoutPointer;
        lines.forEach((line, index) => {
          line.style.transform = `scaleX(${.94 + x * .12}) skewX(${(x - .5) * (index ? -5 : 5)}deg)`;
          line.style.letterSpacing = `${-.085 + y * .025}em`;
        });
        floaters.forEach((floater, index) => {
          floater.style.transform = `translate(${(x - .5) * (index ? -22 : 28)}px, ${(y - .5) * (index ? 18 : -20)}px) rotate(${index ? -7 : 3}deg)`;
        });
        layoutPointer = null;
      }
      if (moving && onscreen && !paused && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const wake = () => { if (!frame && onscreen && !document.hidden) frame = requestAnimationFrame(draw); };
    const move = (event: PointerEvent) => {
      if (paused || event.pointerType !== 'mouse') return;
      const rect = host.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      layoutPointer = { x: pointer.x / rect.width, y: pointer.y / rect.height };
      wake();
    };
    const leave = () => { pointer = { x: -999, y: -999 }; layoutPointer = null; resetLayers(); wake(); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else wake(); };
    const resizeObserver = new ResizeObserver(() => { resize(); leave(); });
    const intersection = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      if (!onscreen) { cancelAnimationFrame(frame); frame = 0; leave(); } else wake();
    });
    resizeObserver.observe(host); intersection.observe(host);
    host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    resize(); draw();
    return () => {
      cancelAnimationFrame(frame); resetLayers(); resizeObserver.disconnect(); intersection.disconnect();
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [paused]);

  return <section className="first-hero" id="top" ref={rootRef} aria-label="Arthur，Go 后端开发" data-motion-section>
    <canvas className="first-hero-field" ref={canvasRef} aria-hidden="true" />
    <div className="first-kicker hero-opening-target"><span>2027 届软件工程本科生 · Go 后端开发</span><span>Ma’anshan · China</span></div>
    <h1 className="first-pressure-title hero-opening-target" aria-label="Arthur — Backend Developer"><span className="first-pressure-line">ARTHUR</span><span className="first-pressure-line first-accent">DEVELOPER</span></h1>
    <div className="first-bottom hero-opening-target"><p>我是 Arthur。最近一边准备求职，<br className="first-desktop-break" />一边完善电商后端，也继续维护自己的 AI 求职工具。</p><a className="first-round-link" href="#work" aria-label="查看项目"><span>VIEW<br />WORK</span><b aria-hidden="true">↘</b></a></div>
    <div className="first-window-position first-window-a hero-opening-target"><div className="first-floating-window" aria-hidden="true"><span className="first-window-label">REQUEST FLOW / CONCEPT</span><div className="first-flow-row"><i /><b>Gateway</b><em>route</em></div><div className="first-flow-row"><i /><b>Service</b><em>process</em></div><div className="first-flow-row"><i /><b>MySQL</b><em>persist</em></div></div></div>
    <div className="first-window-position first-window-b hero-opening-target"><div className="first-floating-window"><span className="first-window-label">CURRENT PROJECT</span><strong>SurgeCart</strong><small>Orders · Stock · Recovery</small></div></div>
    <span className="first-scroll-cue" aria-hidden="true">Scroll to inspect <span>↓</span></span>
    <button className="first-motion-toggle" type="button" onClick={toggleMotion} aria-pressed={motionDisabled} disabled={reduced}>{reduced ? '系统减少动效' : motionDisabled ? '开启动效 ▷' : '暂停动效 Ⅱ'}</button>
  </section>;
}
