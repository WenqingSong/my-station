import { useLayoutEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION } from '../motion';
import './selected-work.css';

type Project = {
  id: string; index: string; title: string; subtitle: string; category: string;
  label: string; heading: ReactNode; description: string; focus: string; stack: string;
};

function ProjectVisual({ kind }: { kind: string }) {
  if (kind === 'delivery') return <div className="delivery-system">
    <div className="delivery-orbit orbit-one" /><div className="delivery-orbit orbit-two" />
    <div className="delivery-route"><span>ORDER</span><i /><span>KITCHEN</span><i /><span>HANDOFF</span></div>
    <div className="delivery-slip slip-back"><span>02 / FULFILMENT</span><strong>Prepare.</strong><i /><i /><i /></div>
    <div className="delivery-slip slip-front"><span>01 / REQUEST</span><strong>One order.<br />Every step.</strong><div className="slip-divider" /><p>订单 · 履约 · 状态</p><div className="slip-bars" /></div>
    <span className="visual-coordinate">A → B → C</span>
  </div>;
  if (kind === 'backend') return <div className="backend-system">
    <div className="service-axis" />
    {['INTERFACE', 'SERVICE', 'DATA'].map((label, i) => <div className={`service-plane plane-${i}`} key={label}>
      <span>0{i + 1}</span><strong>{label}</strong><div className="plane-grid" /><i />
    </div>)}
    <span className="visual-coordinate">REQUEST / RESPONSE</span>
  </div>;
  return <div className="matching-system">
    <div className="match-orbit" /><div className="match-links"><i /><i /><i /><i /><i /></div>
    <div className="match-document document-a"><span>01 / PROFILE</span><strong>Skills.<br />Experience.<br />Potential.</strong><div className="document-lines"><i /><i /><i /><i /></div></div>
    <div className="match-document document-b"><span>02 / OPPORTUNITY</span><strong>Context.<br />Requirements.<br />Connection.</strong><div className="document-lines"><i /><i /><i /><i /></div></div>
    <div className="match-core">×</div><span className="visual-coordinate">RETRIEVE → REASON → EXPLAIN</span>
  </div>;
}

function WorkScene({ project, compact, disabled }: { project: Project; compact: boolean; disabled: boolean }) {
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
          <div className="scene-editorial"><h4>{project.heading}</h4><p>{project.description}</p></div>
        </div>
        <div className={`scene-art ${expanded ? 'is-expanded' : ''}`} ref={visualRef} onPointerMove={move} onPointerLeave={reset}>
          <div className="scene-art-crop"><div className="scene-art-parallax"><div className="scene-art-tilt" aria-hidden="true"><ProjectVisual kind={project.id} /></div></div></div>
          <div className="scene-art-caption"><span>CONCEPT STUDY / {project.label}</span><button type="button" data-cursor="action" aria-label={`${project.subtitle}：${expanded ? '收拢' : '展开'}主视觉`} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}><span>{expanded ? '收拢视图' : '探索结构'}</span><i aria-hidden="true">{expanded ? '−' : '+'}</i></button></div>
        </div>
      </div>
      <div className="scene-bottomline"><div><span>FOCUS / 关注</span><p>{project.focus}</p></div><div><span>TECHNOLOGY / 技术方向</span><p>{project.stack}</p></div><a href={project.id === 'matching' ? '#skills' : `#work-${project.id === 'delivery' ? 'backend' : 'matching'}`} aria-label={project.id === 'matching' ? '继续阅读技术能力' : '下一个项目'}>{project.id === 'matching' ? 'The foundation' : 'Next project'} <span aria-hidden="true">↓</span></a></div>
    </div>
  </article>;
}

export default function SelectedWork({ projects, compact, disabled }: { projects: Project[]; compact: boolean; disabled: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const scenes = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('.work-scene') ?? []);
    const measure = () => scenes.forEach(scene => scene.style.setProperty('--scene-top', `${Math.min(0, innerHeight - scene.offsetHeight)}px`));
    const observer = new ResizeObserver(measure);
    scenes.forEach(scene => observer.observe(scene));
    addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); removeEventListener('resize', measure); };
  }, []);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || disabled) return;
    const context = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>('.work-scene', root);
      scenes.forEach((scene, index) => {
        const lines = scene.querySelectorAll('.scene-title-line');
        gsap.fromTo(lines, { yPercent: 110, rotate: compact ? 0 : 3 }, {
          yPercent: 0, rotate: 0, stagger: .09, duration: compact ? .65 : 1.05, ease: MOTION.ease.reveal,
          scrollTrigger: { trigger: scene, start: 'top 78%', toggleActions: 'play none none reverse' }
        });
        if (compact) return;
        gsap.fromTo(scene.querySelector('.scene-art-crop'),
          { clipPath: 'inset(10% 7% 8% 7% round 4px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 4px)', ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'top top', scrub: .75 } });
        gsap.fromTo(scene.querySelector('.scene-art-parallax'), { yPercent: 9, scale: 1.06 }, {
          yPercent: -3, scale: 1, ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: .8 }
        });
        if (scenes[index + 1]) {
          gsap.to(scene.querySelector('.scene-inner'), { y: -34, scale: .96, opacity: .35, transformOrigin: '50% 0%', ease: 'none',
            scrollTrigger: { trigger: scenes[index + 1], start: 'top 92%', end: 'top top', scrub: .65 } });
        }
      });
    }, root);
    let active = true;
    const refresh = () => { if (active) ScrollTrigger.refresh(); };
    document.fonts.ready.then(refresh);
    return () => { active = false; context.revert(); };
  }, [compact, disabled]);
  return <section className={`selected-work ${compact || disabled ? 'work-linear' : ''} ${disabled ? 'work-still' : ''}`} id="work" ref={rootRef} aria-labelledby="work-heading">
    <div className="work-prologue section-shell"><p className="eyebrow">SELECTED WORK / 01—03</p><h2 id="work-heading">Built with purpose<span>.</span></h2><div><p>从业务流程，到工程实践，<br />再到 AI 与后端的交汇。</p><span>SCROLL TO EXPLORE ↓</span></div></div>
    <div className="work-scenes">{projects.map(project => <WorkScene key={project.id} project={project} disabled={disabled} compact={compact} />)}</div>
  </section>;
}
