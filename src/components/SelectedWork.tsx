import { Fragment, useLayoutEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION } from '../motion';
import { workEvidence } from './work-evidence';
import { workSceneMetrics } from './work-scene-metrics';
import './selected-work.css';

type Project = {
  id: string; index: string; title: string; subtitle: string; category: string;
  label: string; heading: ReactNode; description: string; focus: string; stack: string;
};

function offsetInScene(element: HTMLElement, scene: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = element;
  while (node && node !== scene) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

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
  const [expanded, setExpanded] = useState(false);
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
  const reset = () => {
    cancelAnimationFrame(pointerFrame.current);
    visualRef.current?.style.setProperty('--pointer-x', '0deg');
    visualRef.current?.style.setProperty('--pointer-y', '0deg');
  };
  const words = project.title === 'AI × Recruitment' ? ['AI ×', 'Recruitment'] : project.title.split(' ');
  return <article className={`work-scene scene-${project.id}`} id={`work-${project.id}`} aria-labelledby={`title-${project.id}`}>
    <div className="scene-inner">
      <div className="scene-topline"><span>{project.index} / SELECTED WORK</span><span>{project.category}</span></div>
      <div className="scene-layout">
        <div className="scene-copy">
          <span className="scene-number" aria-hidden="true">{project.index}</span>
          <h3 id={`title-${project.id}`} aria-label={project.title}><span className="scene-title-follow">{words.map(word => <span className="scene-title-mask" key={word}><span className="scene-title-line" aria-hidden="true">{word}</span></span>)}</span></h3>
          <p className="scene-subtitle">{project.subtitle}</p>
          <div className="scene-editorial"><h4>{project.heading}</h4><p>{evidence.problem}</p></div>
          <a className="work-repository" href={evidence.repo} target="_blank" rel="noopener noreferrer" aria-label={`查看 ${project.title} 源码，新窗口打开`}>查看项目源码 <span aria-hidden="true">↗</span></a>
        </div>
        <div className={`scene-art ${expanded ? 'is-expanded' : ''}`} ref={visualRef} onPointerMove={move} onPointerLeave={reset}>
          <div className="scene-art-crop"><div className="scene-art-parallax"><div className="scene-art-tilt" aria-hidden="true"><ProjectVisual kind={project.id} /></div></div></div>
          <div className="scene-art-caption"><span>{project.label} / 链路示意，非运行数据</span><button type="button" data-cursor="action" aria-label={`${project.subtitle}：${expanded ? '收拢' : '展开'}主视觉`} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}><span>{expanded ? '收拢视图' : '探索结构'}</span><i aria-hidden="true">{expanded ? '−' : '+'}</i></button></div>
        </div>
      </div>
      <div className="work-evidence">
        <div><h4><span>01 /</span> 关键决策</h4><p>{evidence.decision}</p></div>
        <div><h4><span>02 /</span> 实现依据</h4><p>{evidence.evidence}</p><div className="work-evidence-links">{evidence.links.map(link => <a href={link.url} key={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.title}：${link.label}，新窗口打开`}>{link.label}<span aria-hidden="true">↗</span></a>)}</div></div>
      </div>
      <div className="scene-bottomline"><div><span>SCOPE / 当前边界</span><p>{evidence.boundary}</p></div><div><span>TECHNOLOGY / 技术方向</span><p>{project.stack}</p></div><a href={project.id === 'matching' ? '#skills' : `#work-${project.id === 'delivery' ? 'backend' : 'matching'}`} aria-label={project.id === 'matching' ? '继续阅读技术能力' : '下一个项目'}>{project.id === 'matching' ? 'The foundation' : 'Next project'} <span aria-hidden="true">↓</span></a></div>
    </div>
  </article>;
}

export default function SelectedWork({ projects, compact, disabled }: { projects: Project[]; compact: boolean; disabled: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const scenes = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('.work-scene') ?? []);
    let frame = 0;
    let alive = true;
    const measure = () => {
      frame = 0;
      scenes.forEach(scene => {
        const metrics = workSceneMetrics(scene.offsetHeight, innerHeight);
        scene.style.setProperty('--scene-top', `${metrics.top}px`);
        scene.style.setProperty('--scene-hold', `${metrics.hold}px`);
      });
      ScrollTrigger.refresh();
    };
    const schedule = () => { if (alive && !frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    scenes.forEach(scene => observer.observe(scene));
    addEventListener('resize', schedule);
    document.fonts.ready.then(schedule);
    schedule();
    return () => { alive = false; cancelAnimationFrame(frame); observer.disconnect(); removeEventListener('resize', schedule); };
  }, [compact, disabled]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || disabled) return;
    const context = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>('.work-scene', root);
      scenes.forEach((scene, index) => {
        // Normal-flow markers keep trigger positions stable when sticky scenes
        // overlap, on reverse scrolling and after a font/viewport refresh.
        const trigger = scene.previousElementSibling as HTMLElement;
        const art = scene.querySelector<HTMLElement>('.scene-art')!;
        const lines = scene.querySelectorAll('.scene-title-line');
        gsap.fromTo(lines, { yPercent: 110, rotate: compact ? 0 : 3 }, {
          yPercent: 0, rotate: 0, stagger: .09, duration: compact ? .65 : 1.05, ease: MOTION.ease.reveal,
          scrollTrigger: { trigger, start: 'top 88%', toggleActions: 'play none none reverse', invalidateOnRefresh: true }
        });
        gsap.fromTo(scene.querySelector('.scene-art-crop'),
          { clipPath: compact ? 'inset(4% 3% 4% 3% round 4px)' : 'inset(10% 7% 8% 7% round 4px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 4px)', ease: 'none', scrollTrigger: { trigger, start: () => `top+=${offsetInScene(art, scene)} bottom`, end: () => `top+=${offsetInScene(art, scene)} 28%`, scrub: compact ? true : .75, invalidateOnRefresh: true } });
        if (compact) return;
        gsap.fromTo(scene.querySelector('.scene-art-parallax'), { yPercent: 9, scale: 1.06 }, {
          yPercent: -3, scale: 1, ease: 'none', scrollTrigger: { trigger, start: 'top bottom', end: () => `+=${scene.offsetHeight + innerHeight}`, scrub: .8, invalidateOnRefresh: true }
        });
        if (scenes[index + 1]) {
          gsap.set(scene.querySelector('.scene-inner'), { transformOrigin: '50% 0%' });
          gsap.to(scene.querySelector('.scene-inner'), { y: -34, scale: .96, opacity: .35, ease: 'none',
            scrollTrigger: { trigger: scenes[index + 1].previousElementSibling, start: 'top 82%', end: 'top top', scrub: .65, invalidateOnRefresh: true } });
        }
      });
    }, root);
    let active = true;
    const refresh = () => { if (active) ScrollTrigger.refresh(); };
    document.fonts.ready.then(refresh);
    return () => { active = false; context.revert(); };
  }, [compact, disabled]);
  return <section className={`selected-work ${compact || disabled ? 'work-linear' : ''} ${disabled ? 'work-still' : ''}`} id="work" ref={rootRef} aria-labelledby="work-heading">
    <span id="intro" className="work-legacy-anchor" aria-hidden="true" />
    <div className="work-prologue section-shell"><p className="eyebrow">SELECTED WORK / 01—03</p><h2 id="work-heading">Selected projects<span>.</span></h2><div><p>交易中的重复请求、Agent 的任务交接，<br />以及自己的求职需求。三个项目，三种具体问题。</p><span>SCROLL TO EXPLORE ↓</span></div></div>
    <div className="work-scenes">{projects.map(project => <Fragment key={project.id}><div className="work-flow-marker" aria-hidden="true" /><WorkScene project={project} disabled={disabled} compact={compact} /></Fragment>)}</div>
    <div className="work-context section-shell"><p>这些项目由我主导方案、推进与验收，使用 AI Agent 协作开发。链接指向具体版本的实现与测试源码，不代表生产环境验证。</p><p><span>团队经历 / 2026.07—08</span>在杭州智航星辰人工智能科技有限公司做 Go 后端实习，参与企业课程平台开发，跟进 AI 客服系统的问题定位、修复和联调。</p></div>
  </section>;
}
