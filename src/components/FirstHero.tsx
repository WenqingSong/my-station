import { useEffect, useRef, useState } from 'react';

type HeroProject = {
  id: string; index: string; title: string; subtitle: string;
  preview: { note: string; steps: string[][] };
};
type Props = {
  projects: HeroProject[];
  paused: boolean; motionDisabled: boolean; reduced: boolean; toggleMotion: () => void;
};

export default function FirstHero({ projects, paused, motionDisabled, reduced, toggleMotion }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeId, setActiveId] = useState(projects[0].id);
  const active = projects.find(project => project.id === activeId) ?? projects[0];

  useEffect(() => {
    const host = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!host || !canvas || !ctx) return;
    let points: { x: number; y: number; ox: number; oy: number; radius: number; quiet: number }[] = [];
    let width = 0, height = 0, frame = 0;
    let onscreen = true, alive = true;
    let pointer = { x: -999, y: -999 };
    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Measure only at layout changes, never on every frame. Text and controls remain quiet.
      const quietAreas = [...host.querySelectorAll<HTMLElement>('[data-field-quiet]')].map(element => {
        const box = element.getBoundingClientRect();
        return { left: box.left - rect.left - 12, right: box.right - rect.left + 12, top: box.top - rect.top - 12, bottom: box.bottom - rect.top + 12 };
      });
      const step = width < 700 ? 42 : 34;
      points = [];
      for (let y = step; y < height; y += step) for (let x = step; x < width; x += step) {
        const distance = Math.min(...quietAreas.map(box => Math.hypot(
          Math.max(box.left - x, 0, x - box.right), Math.max(box.top - y, 0, y - box.bottom)
        )));
        points.push({ x, y, ox: x, oy: y, radius: 1, quiet: Math.min(1, distance / 64) });
      }
    };
    const draw = () => {
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      let moving = false;
      points.forEach(point => {
        const dx = point.ox - pointer.x, dy = point.oy - pointer.y;
        const distance = Math.hypot(dx, dy);
        const force = paused ? 0 : Math.max(0, 1 - distance / 160) * point.quiet;
        const angle = Math.atan2(dy, dx);
        const tx = point.ox + Math.cos(angle) * force * 22;
        const ty = point.oy + Math.sin(angle) * force * 22;
        const radius = 1 + force * 2;
        point.x += (tx - point.x) * .12;
        point.y += (ty - point.y) * .12;
        point.radius += (radius - point.radius) * .12;
        if (Math.abs(tx - point.x) + Math.abs(ty - point.y) + Math.abs(radius - point.radius) > .025) moving = true;
        ctx.fillStyle = 'rgba(16,16,16,' + (.05 + point.quiet * .2) + ')';
        ctx.beginPath(); ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2); ctx.fill();
      });
      if (moving && onscreen && !paused && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const wake = () => { if (!frame && onscreen && !document.hidden) frame = requestAnimationFrame(draw); };
    const leave = () => { pointer = { x: -999, y: -999 }; wake(); };
    const move = (event: PointerEvent) => {
      if (paused || event.pointerType !== 'mouse') return;
      // Hovering a real link should never distort its visual target.
      if ((event.target as Element).closest('a, button, .first-project-explorer')) { leave(); return; }
      const rect = host.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      wake();
    };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; leave(); } else wake(); };
    // The opening briefly translates the content. Refresh its quiet zones once it settles.
    let openingLocked = document.documentElement.classList.contains('intro-locked');
    const openingObserver = new MutationObserver(() => {
      const locked = document.documentElement.classList.contains('intro-locked');
      if (openingLocked && !locked) { resize(); leave(); }
      openingLocked = locked;
    });
    openingObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const resizeObserver = new ResizeObserver(() => { resize(); leave(); });
    const intersection = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      if (!onscreen) { cancelAnimationFrame(frame); frame = 0; leave(); } else wake();
    });
    resizeObserver.observe(host);
    host.querySelectorAll<HTMLElement>('[data-field-quiet]').forEach(element => resizeObserver.observe(element));
    intersection.observe(host);
    host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    document.fonts.ready.then(() => { if (alive) { resize(); leave(); } });
    resize(); draw();
    return () => {
      alive = false; cancelAnimationFrame(frame); resizeObserver.disconnect(); intersection.disconnect(); openingObserver.disconnect();
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [paused]);

  return <section className={`first-hero${paused ? ' first-hero-still' : ''}`} id="top" ref={rootRef} aria-label="Arthur，Go 后端开发" data-motion-section>
    <canvas className="first-hero-field" ref={canvasRef} aria-hidden="true" />
    <div className="first-kicker hero-opening-target" data-field-quiet><span>2027 届软件工程本科生 · Go 后端开发</span><span>Ma’anshan · China</span></div>

    <div className="first-project-explorer hero-opening-target">
      <nav className="first-window-position first-window-b" aria-label="首页项目入口" data-field-quiet>
        <div className="first-floating-window">
          <span className="first-window-label">SELECTED WORK / 03</span>
          <ul className="first-project-list">
            {projects.map(project => <li key={project.id}>
              <a href={`#work-${project.id}`} aria-label={`查看 ${project.title} 项目介绍`}
                data-preview-active={project.id === active.id}
                onPointerEnter={event => { if (event.pointerType === 'mouse') setActiveId(project.id); }}
                onFocus={() => setActiveId(project.id)}>
                <span className="first-project-number">{project.index}</span><span>{project.title}</span><span className="first-project-arrow" aria-hidden="true">↗</span>
              </a>
            </li>)}
          </ul>
          <small className="first-project-hint"><span className="first-hover-hint">悬停预览 · 点击查看</span><span className="first-touch-hint">点击项目名查看案例</span></small>
        </div>
      </nav>
      <a className="first-window-position first-window-a" href={`#work-${active.id}`} aria-label={`打开 ${active.title} 案例`} data-field-quiet>
        <div className="first-floating-window">
          <span className="first-window-label">PROJECT PREVIEW <span>{active.index} / 03</span></span>
          <div className="first-preview-content" key={active.id}>
            <h2>{active.title}</h2>
            <p className="first-preview-subtitle">{active.subtitle}</p>
            <div className="first-preview-flow">{active.preview.steps.map(([name, action]) =>
              <div className="first-flow-row" key={name}><i aria-hidden="true" /><b>{name}</b><em>{action}</em></div>
            )}</div>
            <p className="first-preview-note">{active.preview.note}</p>
          </div>
          <span className="first-preview-footer"><span>结构示意 · 非实时监控</span><b>查看案例 ↗</b></span>
        </div>
      </a>
    </div>

    <h1 className="first-pressure-title hero-opening-target" aria-label="Arthur — Backend Developer"><span className="first-pressure-line" data-field-quiet>ARTHUR</span><span className="first-pressure-line first-accent" data-field-quiet>DEVELOPER</span></h1>
    <div className="first-bottom hero-opening-target">
      <div className="first-intro-copy" data-field-quiet>
        <p>我是 Arthur。最近一边准备求职，<br className="first-desktop-break" />一边完善电商后端，也继续维护自己的 AI 求职工具。</p>
        <a className="first-contact-link" href="#contact">联系我 <span aria-hidden="true">↗</span></a>
      </div>
      <a className="first-round-link" href="#work" data-field-quiet><span>查看作品<small>VIEW WORK</small></span><b aria-hidden="true">↘</b></a>
    </div>
    <span className="first-scroll-cue" aria-hidden="true">More below <span>↓</span></span>
    <button className="first-motion-toggle" type="button" onClick={toggleMotion} aria-pressed={motionDisabled} disabled={reduced}>{reduced ? '系统减少动效' : motionDisabled ? '开启动效 ▷' : '暂停动效 Ⅱ'}</button>
  </section>;
}
