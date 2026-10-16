import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createStoryTween, offsetWithin, stickySceneTop } from '../scroll-story';
import { workEvidence } from './work-evidence';
import './selected-work.css';

type Project = {
  id: string; index: string; title: string; subtitle: string; category: string;
  label: string; heading: ReactNode; description: string; focus: string; stack: string;
};

function ProjectVisual({ kind }: { kind: string }) {
  if (kind === 'delivery') return <div className="delivery-system">
    <div className="delivery-orbit orbit-one" /><div className="delivery-orbit orbit-two" />
    <div className="delivery-route"><span>ADMIT</span><i /><span>QUEUE</span><i /><span>COMMIT</span></div>
    <div className="delivery-slip slip-back"><span>02 / MYSQL QUEUE</span><strong>Queued.</strong><i /><i /><i /></div>
    <div className="delivery-slip slip-front"><span>01 / REDIS LUA</span><strong>Accepted.<br />Not sold.</strong><div className="slip-divider" /><p>准入 ≠ 下单成功</p><div className="slip-bars" /></div>
    <span className="visual-coordinate">A → B → C</span>
  </div>;
  if (kind === 'backend') return <div className="backend-system">
    <div className="service-axis" />
    {['TASK', 'REVIEW', 'COMMIT'].map((label, i) => <div className={`service-plane plane-${i}`} key={label}>
      <span>0{i + 1}</span><strong>{label}</strong><div className="plane-grid" /><i />
    </div>)}
    <span className="visual-coordinate">TASK / REVIEW / GIT COMMIT</span>
  </div>;
  return <div className="matching-system">
    <div className="match-orbit" /><div className="match-links"><i /><i /><i /><i /><i /></div>
    <div className="match-document document-a"><span>01 / RESUME</span><strong>Skills.<br />Projects.<br />Experience.</strong><div className="document-lines"><i /><i /><i /><i /></div></div>
    <div className="match-document document-b"><span>02 / JOB</span><strong>Role.<br />Skills.<br />Requirements.</strong><div className="document-lines"><i /><i /><i /><i /></div></div>
    <div className="match-core">×</div><span className="visual-coordinate">FAST / DEEP ANALYSIS</span>
  </div>;
}

function WorkScene({ project, compact, disabled }: { project: Project; compact: boolean; disabled: boolean }) {
  const evidence = workEvidence[project.id];
  const visualRef = useRef<HTMLDivElement>(null);
  const pointerFrame = useRef(0);
  useLayoutEffect(() => () => cancelAnimationFrame(pointerFrame.current), []);
  useLayoutEffect(() => {
    if (disabled || compact) {
      cancelAnimationFrame(pointerFrame.current);
      visualRef.current?.style.removeProperty('--pointer-x');
      visualRef.current?.style.removeProperty('--pointer-y');
    }
  }, [disabled, compact]);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || compact || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = requestAnimationFrame(() => {
      visualRef.current?.style.setProperty('--pointer-x', `${x * 7}deg`);
      visualRef.current?.style.setProperty('--pointer-y', `${-y * 7}deg`);
    });
  };
  const reset = useCallback(() => {
    cancelAnimationFrame(pointerFrame.current);
    visualRef.current?.style.setProperty('--pointer-x', '0deg');
    visualRef.current?.style.setProperty('--pointer-y', '0deg');
  }, []);
  useEffect(() => {
    addEventListener('scroll', reset, { passive: true });
    addEventListener('resize', reset);
    addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      removeEventListener('scroll', reset); removeEventListener('resize', reset); removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [reset]);
  return <><span className="work-beat" aria-hidden="true" /><article className={`work-scene scene-${project.id}`} id={`work-${project.id}`} aria-labelledby={`title-${project.id}`}>
    <div className="scene-inner">
      <div className="scene-topline"><span>{project.index} / SELECTED WORK</span><span>{project.category}</span></div>
      <div className="scene-layout">
        <div className="scene-copy">
          <span className="scene-number" aria-hidden="true">{project.index}</span>
          <h3 id={`title-${project.id}`}><span className="scene-title-mask"><span className="scene-title-line">{project.title}</span></span></h3>
          <p className="scene-subtitle">{project.subtitle}</p>
          <div className="scene-editorial"><h4>{project.heading}</h4><p>{evidence.problem}</p></div>
          <a className="case-repository" href={evidence.repo} target="_blank" rel="noopener noreferrer" aria-label={`查看 ${project.title} 源码，新窗口打开`}>查看项目源码 <span aria-hidden="true">↗</span></a>
        </div>
        <div className="scene-art" ref={visualRef} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
          <div className="scene-art-crop"><div className="scene-art-parallax"><div className="scene-art-tilt" aria-hidden="true"><ProjectVisual kind={project.id} /></div></div></div>
          <div className="scene-art-caption"><span>{project.label} / 链路示意，非运行数据</span><span aria-hidden="true">FIG. {project.index}</span></div>
        </div>
      </div>
      <div className="case-notes">
        <div><h4><span>01</span> 关键决策</h4><p>{evidence.decision}</p></div>
        <div><h4><span>02</span> 实现与验证</h4><p>{evidence.evidence}</p><div className="case-evidence-links">{evidence.links.map(link => <a href={link.url} key={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.title}：${link.label}，新窗口打开`}>{link.label} <span aria-hidden="true">↗</span></a>)}</div></div>
      </div>
      <div className="case-footnote"><p>{evidence.boundary}</p><span>{project.stack}</span></div>
    </div>
  </article></>;
}

export default function SelectedWork({ projects, compact, disabled }: { projects: Project[]; compact: boolean; disabled: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || disabled) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('.work-scene'));
    const measure = () => scenes.forEach(scene => {
      scene.style.setProperty('--scene-top', `${stickySceneTop(innerHeight, scene.offsetHeight)}px`);
    });
    measure();
    const context = gsap.context(() => {
      const prologue = root.querySelector<HTMLElement>('.work-prologue')!;
      createStoryTween(prologue.querySelector('h2'), 'chapter', compact, { trigger: prologue, start: 'top bottom', end: 'top 55%', scrub: true });
      scenes.forEach((scene, index) => {
        // A zero-height sibling stays in normal flow when the scene sticks.
        // Refreshing halfway down the page therefore cannot shift its timing.
        const marker = scene.previousElementSibling as HTMLElement;
        const title = scene.querySelector<HTMLElement>('h3')!;
        const crop = scene.querySelector<HTMLElement>('.scene-art-crop')!;
        const position = (element: HTMLElement, viewport: string, bottom = false) => () => `top+=${offsetWithin(element, scene) + (bottom ? element.offsetHeight : 0)} ${viewport}`;
        createStoryTween(title.querySelector('.scene-title-line'), 'title', compact, {
          trigger: marker, start: position(title, '98%'), end: position(title, '78%'), scrub: true, invalidateOnRefresh: true
        });
        createStoryTween(crop, 'crop', compact, {
          trigger: marker, start: position(crop, '95%'), end: position(crop, compact ? '55%' : '32%'), scrub: true, invalidateOnRefresh: true
        });
        createStoryTween(scene.querySelector('.scene-art-parallax'), 'artwork', compact, {
          trigger: marker, start: position(crop, 'bottom'), end: position(crop, 'top', true), scrub: true, invalidateOnRefresh: true
        });
        const next = scenes[index + 1];
        if (next && !compact) createStoryTween(scene.querySelector('.scene-inner'), 'handoff', false, {
          trigger: next.previousElementSibling, start: 'top 94%', end: 'top top', scrub: true, invalidateOnRefresh: true
        });
      });
    }, root);
    let frame = 0;
    const resized = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { measure(); ScrollTrigger.refresh(); });
    };
    const observer = new ResizeObserver(resized);
    scenes.forEach(scene => observer.observe(scene));
    addEventListener('resize', resized);
    ScrollTrigger.addEventListener('refreshInit', measure);
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame); removeEventListener('resize', resized);
      ScrollTrigger.removeEventListener('refreshInit', measure);
      context.revert(); scenes.forEach(scene => scene.style.removeProperty('--scene-top'));
    };
  }, [compact, disabled]);
  return <section className={`selected-work lower-work ${compact || disabled ? 'work-linear' : 'work-scroll'} ${disabled ? 'work-still' : ''}`} id="work" ref={rootRef} aria-labelledby="work-heading">
    <span id="intro" className="legacy-section-anchor" aria-hidden="true" />
    <div className="work-prologue section-shell"><p className="eyebrow">01 / SELECTED WORK</p><h2 id="work-heading">项目，和背后的<span className="title-ending">选择<span className="title-period">。</span></span></h2><div><p>从交易里的重复请求，到 Agent 交接，再到自己的求职需求。</p><span>三个个人项目 · 源码与测试可查</span></div></div>
    <div className="work-scenes">{projects.map(project => <WorkScene key={project.id} project={project} disabled={disabled} compact={compact} />)}</div>
    <div className="work-coda section-shell"><p>这些项目由我主导方案、推进与验收，使用 AI Agent 协作开发。</p><a href="#about">代码之外，关于我 <span aria-hidden="true">↓</span></a></div>
  </section>;
}
