import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimatedContent from './components/AnimatedContent';
import ScrollFloat from './components/ScrollFloat';
import SelectedWork from './components/SelectedWork';
import AboutEditorial from './components/AboutEditorial';
import SiteDetails from './components/SiteDetails';
import JobsModal from './components/JobsModal';
import { useCompactMotion, useMotionInfrastructure } from './motion';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    id: 'delivery',
    index: '01',
    title: 'Campus Delivery',
    subtitle: '校园外卖平台',
    category: 'Go · Business systems',
    label: '业务闭环',
    heading: <>把一次下单，<br />放回完整流程。</>,
    description: '面向校园场景的点餐与外卖课程项目，围绕商品、订单与商家履约展开后端实践。',
    focus: '状态流转、数据一致性，以及异常发生后的处理边界。',
    stack: 'Go / Gin / MySQL / Redis'
  },
  {
    id: 'backend',
    index: '02',
    title: 'Backend Practice',
    subtitle: 'Go 后端开发实习',
    category: 'Go · Engineering',
    label: '工程实践',
    heading: <>在真实约束下，<br />理解与改进。</>,
    description: '在已有业务和代码结构中参与 Go 后端开发，连接接口、服务逻辑与数据访问。',
    focus: '请求路径、接口边界、中间件协作与失败处理。',
    stack: 'Go / REST / gRPC / MySQL / Redis'
  },
  {
    id: 'matching',
    index: '03',
    title: 'AI × Recruitment',
    subtitle: '岗位匹配与简历优化',
    category: 'AI · Backend systems',
    label: 'AI 与后端',
    heading: <>找到关联，<br />也解释关联。</>,
    description: '结合大模型与后端工程，探索岗位信息、个人简历和匹配建议之间的连接。',
    focus: '信息提取、检索与结构化输出，让匹配结果能够被理解。',
    stack: 'Go / LLM API / 向量检索'
  }
];

const greetings = [
  { text: '你好', locale: 'zh-CN', label: 'Mandarin' },
  { text: 'Hello', locale: 'en', label: 'English' },
  { text: 'Bonjour', locale: 'fr', label: 'Français' },
  { text: 'Hola', locale: 'es', label: 'Español' },
  { text: 'Ciao', locale: 'it', label: 'Italiano' },
  { text: 'Hallo', locale: 'de', label: 'Deutsch' },
  { text: 'Olá', locale: 'pt', label: 'Português' },
  { text: 'こんにちは', locale: 'ja', label: '日本語' },
  { text: '안녕하세요', locale: 'ko', label: '한국어' },
  { text: 'مرحباً', locale: 'ar', label: 'العربية' },
  { text: 'नमस्ते', locale: 'hi', label: 'हिन्दी' },
  { text: 'Привет', locale: 'ru', label: 'Русский' },
  { text: 'Merhaba', locale: 'tr', label: 'Türkçe' },
  { text: 'Sawubona', locale: 'zu', label: 'isiZulu' }
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

type OpeningProps = {
  reduced: boolean;
  onComplete?: () => void;
};

function Opening({ reduced, onComplete }: OpeningProps) {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const finish = useCallback(() => {
    document.documentElement.classList.remove('intro-locked');
    gsap.set(document.querySelectorAll('.hero-opening-target'), { clearProps: 'transform,opacity' });
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  const skip = useCallback(() => {
    timeline.current?.kill();
    finish();
  }, [finish]);

  useLayoutEffect(() => {
    if (!visible || !rootRef.current) {
      document.documentElement.classList.remove('intro-locked');
      return;
    }
    if (reduced) {
      finish();
      return;
    }
    document.documentElement.classList.add('intro-locked');
    let cancelled = false;
    let context: gsap.Context | undefined;
    const begin = () => {
      if (cancelled || !rootRef.current) return;
      const heroTargets = document.querySelectorAll('.hero-opening-target');
      gsap.set(heroTargets, { opacity: 0, y: 28 });
      context = gsap.context(() => {
        const sequence = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish });
        timeline.current = sequence;
        sequence
          .from('.opening-meta > *', { y: 14, opacity: 0, duration: .42, stagger: .06 })
          .from('.opening-axis', { scaleX: 0, transformOrigin: 'center', duration: .48 }, '-=.24');

        greetings.forEach((_, index) => {
          const greeting = `.opening-greeting[data-index="${index}"]`;
          const tick = `.opening-trace span:nth-child(${index + 1})`;
          sequence
            .set(greeting, { visibility: 'visible' })
            .fromTo(greeting,
              { clipPath: 'inset(0 100% 0 0)', scaleX: .58, xPercent: -3, transformOrigin: '50% 50%' },
              { clipPath: 'inset(0 0% 0 0)', scaleX: 1.07, xPercent: 0, duration: .095, ease: 'power2.out' })
            .to(greeting, { scaleX: .92, letterSpacing: '-.045em', duration: .055, ease: 'sine.inOut' })
            .to(tick, { scaleX: 1, opacity: 1, duration: .08, ease: 'power2.out' }, '<')
            .to(greeting, { clipPath: 'inset(0 0 0 100%)', xPercent: 3, duration: .075, ease: 'power2.in' })
            .set(greeting, { visibility: 'hidden' });
        });

        sequence
          .to('.opening-trace span', { scaleX: 0, transformOrigin: 'center', duration: .24, stagger: { each: .015, from: 'edges' }, ease: 'power3.in' })
          .to('.opening-axis', { scaleX: .08, backgroundColor: '#3047ff', duration: .28, ease: 'power3.inOut' }, '<+.03')
          .set('.opening-final', { visibility: 'visible' })
          .fromTo('.opening-final',
            { clipPath: 'inset(0 100% 0 0)', scaleX: .72, transformOrigin: '50% 50%' },
            { clipPath: 'inset(0 0% 0 0)', scaleX: 1, duration: .58, ease: 'power4.out' })
          .from('.opening-final-dot', { scale: 0, rotate: -120, duration: .46, ease: 'back.out(2.4)' }, '-=.34')
          .to('.opening-meta, .opening-trace, .opening-final-name', { opacity: 0, y: -14, duration: .36, ease: 'power2.in' }, '+=.34')
          .to('.opening-final-dot', { x: () => innerWidth * .105, y: () => innerHeight * .055, scale: .6, duration: .52, ease: 'power3.inOut' }, '-=.28')
          .addLabel('curtain', '-=.05')
          .to('.opening-panel-top', { yPercent: -101, duration: 1.05, ease: 'power4.inOut' }, 'curtain')
          .to('.opening-panel-bottom', { yPercent: 101, duration: 1.05, ease: 'power4.inOut' }, 'curtain')
          .to('.opening-final-dot', { opacity: 0, scale: .2, duration: .3, ease: 'power2.in' }, 'curtain+=.48')
          .to(heroTargets, { opacity: 1, y: 0, duration: .82, stagger: .055, ease: 'power3.out' }, 'curtain+=.2');
      }, rootRef);
    };
    document.fonts.ready.then(begin);
    return () => {
      cancelled = true;
      timeline.current?.kill();
      context?.revert();
      gsap.set(document.querySelectorAll('.hero-opening-target'), { clearProps: 'transform,opacity' });
      document.documentElement.classList.remove('intro-locked');
    };
  }, [finish, reduced, visible]);

  if (!visible) return null;
  return (
    <div className="opening" ref={rootRef} aria-label="多语言问候开场，最终呈现 Arthur">
      <div className="opening-panel opening-panel-top" aria-hidden="true" />
      <div className="opening-panel opening-panel-bottom" aria-hidden="true" />
      <button className="opening-skip" type="button" onClick={skip}>Skip intro</button>
      <div className="opening-stage" aria-hidden="true">
        <div className="opening-meta"><span>ARTHUR / PORTFOLIO</span><span>14 WAYS TO SAY HELLO</span><span>2026</span></div>
        <span className="opening-axis" />
        <div className="opening-greetings">
          {greetings.map((greeting, index) => (
            <div className="opening-greeting" data-index={index} lang={greeting.locale} key={greeting.locale}>
              <strong>{greeting.text}</strong>
              <small><span>{String(index + 1).padStart(2, '0')} / {greetings.length}</span><em>{greeting.label}</em></small>
            </div>
          ))}
          <div className="opening-final"><span className="opening-final-name">Arthur</span><i className="opening-final-dot">.</i></div>
        </div>
        <div className="opening-trace">
          {greetings.map(greeting => <span key={greeting.locale} />)}
        </div>
        <div className="opening-footer"><span>GO BACKEND</span><span>HELLO / WORLD</span><span>CLOUD COMPUTING</span></div>
      </div>
    </div>
  );
}

function DotField({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !host || !context) return;
    type Point = { ox: number; oy: number; x: number; y: number; radius: number };
    let points: Point[] = [];
    let pointer = { x: -999, y: -999 };
    let frame = 0;
    let width = 0;
    let height = 0;
    let active = true;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const step = width < 700 ? 28 : 31;
      points = [];
      for (let oy = step / 2; oy < height; oy += step) {
        for (let ox = step / 2; ox < width; ox += step) points.push({ ox, oy, x: ox, y: oy, radius: .82 });
      }
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      let moving = false;
      points.forEach(point => {
        const dx = point.ox - pointer.x;
        const dy = point.oy - pointer.y;
        const distance = Math.hypot(dx, dy);
        const force = paused ? 0 : Math.max(0, 1 - distance / 168);
        const targetX = point.ox + (distance ? dx / distance : 0) * force * 12;
        const targetY = point.oy + (distance ? dy / distance : 0) * force * 12;
        const targetRadius = .82 + force * 1.18;
        point.x += (targetX - point.x) * .1;
        point.y += (targetY - point.y) * .1;
        point.radius += (targetRadius - point.radius) * .1;
        if (Math.abs(targetX - point.x) + Math.abs(targetY - point.y) > .04) moving = true;
        context.fillStyle = force > .1 ? `rgba(48,71,255,${.15 + force * .23})` : 'rgba(25,26,30,.2)';
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fill();
      });
      frame = moving && active && !paused ? requestAnimationFrame(draw) : 0;
    };

    const wake = () => { if (!frame && active) frame = requestAnimationFrame(draw); };
    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerType === 'touch' || paused) return;
      const rect = host.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      wake();
    };
    const leave = () => { pointer = { x: -999, y: -999 }; wake(); };
    const resizeObserver = new ResizeObserver(() => { resize(); wake(); });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (!active) { cancelAnimationFrame(frame); frame = 0; }
      else wake();
    });
    resizeObserver.observe(host);
    visibilityObserver.observe(host);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    resize();
    draw();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, [paused]);

  return <canvas ref={canvasRef} className="hero-field" aria-hidden="true" />;
}

function Hero({ paused, motionDisabled, reduced, toggleMotion }: { paused: boolean; motionDisabled: boolean; reduced: boolean; toggleMotion: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const handoff = document.querySelector<HTMLElement>('.intro-title');
    if (paused) {
      gsap.set(section.querySelectorAll('.hero-animate'), { clearProps: 'all' });
      if (handoff) gsap.set(handoff, { clearProps: 'transform,opacity' });
      return;
    }
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.05,
          invalidateOnRefresh: true
        }
      });
      timeline
        .addLabel('depth', 0)
        .to('.hero-statement', { scale: 1.09, yPercent: -3, letterSpacing: '-.078em', transformOrigin: '14% 56%', ease: 'none', duration: .66 }, 'depth')
        .to('.hero-statement-line:first-child', { xPercent: -2.6, ease: 'none', duration: .66 }, 'depth')
        .to('.hero-statement-line:last-child', { xPercent: 3.8, ease: 'none', duration: .66 }, 'depth')
        .to('.hero-kicker', { y: -84, opacity: .12, ease: 'none', duration: .56 }, 'depth')
        .to('.hero-introduction p:first-child', { y: -30, xPercent: -2, opacity: .46, ease: 'none', duration: .64 }, 'depth+=.02')
        .to('.hero-introduction p:last-child', { y: -78, xPercent: 2, scale: .96, opacity: .22, transformOrigin: 'right bottom', ease: 'none', duration: .68 }, 'depth')
        .to('.hero-signature', { y: -52, opacity: .28, ease: 'none', duration: .62 }, 'depth+=.04')
        .to('.hero-baseline', { y: 18, opacity: .18, ease: 'none', duration: .64 }, 'depth')
        .to('.hero-grid', { yPercent: -2, scaleX: .985, opacity: .58, transformOrigin: 'center', ease: 'none', duration: .72 }, 'depth')
        .to('.hero-field', { opacity: .26, scale: 1.025, ease: 'none', duration: .72 }, 'depth')
        .to('.hero-marker', { x: () => -innerWidth * .22, y: () => innerHeight * .18, rotate: 142, scale: .58, ease: 'none', duration: .76 }, 'depth+=.04')
        .to('.hero-marker i', { scale: 1.55, ease: 'none', duration: .76 }, 'depth+=.04')
        .addLabel('handoff', .62)
        .to('.hero-sticky', { scale: .955, yPercent: -1.8, borderRadius: '0 0 34px 34px', boxShadow: '0 24px 70px rgba(25,26,30,.12)', transformOrigin: 'center bottom', ease: 'none', duration: .38 }, 'handoff')
        .to('.hero-statement, .hero-kicker, .hero-introduction, .hero-signature, .hero-baseline, .hero-marker', { opacity: 0, yPercent: -7, ease: 'none', duration: .3 }, 'handoff+=.08')
        .to('.hero-grid, .hero-field', { opacity: 0, ease: 'none', duration: .28 }, 'handoff+=.08');

      if (handoff) {
        timeline.fromTo(handoff,
          { y: 105, opacity: .12 },
          { y: 0, opacity: 1, ease: 'none', duration: .28 },
          'handoff+=.08');
      }
    }, section);
    return () => {
      ctx.revert();
      if (handoff) gsap.set(handoff, { clearProps: 'transform,opacity' });
    };
  }, [paused]);

  return (
    <section className="hero" id="top" ref={sectionRef} aria-label="Arthur，Go 后端开发" data-motion-section>
      <div className="hero-sticky">
        <DotField paused={paused} />
        <div className="hero-grid" aria-hidden="true"><span /><span /><span /></div>
        <div className="hero-kicker hero-animate hero-opening-target"><span>01 / SELECTED PRACTICE</span><span>GO BACKEND · CLOUD COMPUTING</span><span>Ma’anshan, China</span></div>
        <h1 className="hero-statement hero-animate hero-opening-target">
          <span className="hero-statement-line">Engineering</span>
          <span className="hero-statement-line"><i>systems</i> that hold.</span>
        </h1>
        <span className="hero-marker hero-animate hero-opening-target" aria-hidden="true"><i /></span>
        <div className="hero-introduction hero-animate hero-opening-target">
          <p>让请求有路径，<br />让失败有退路。</p>
          <p>专注 Go 后端与云计算，关注请求如何流转、数据如何保持一致，以及系统在压力和失败中如何保持清晰。</p>
        </div>
        <div className="hero-signature hero-animate hero-opening-target"><span>Arthur</span><small>宋文清 / Backend Developer</small></div>
        <div className="hero-baseline hero-animate hero-opening-target">
          <span>PORTFOLIO — 2026</span>
          <a className="text-link" href="#intro">Explore my work <span aria-hidden="true">↓</span></a>
          <button type="button" onClick={toggleMotion} aria-pressed={motionDisabled} disabled={reduced}>{reduced ? '系统减少动效' : motionDisabled ? '开启动效　▷' : '暂停动效　Ⅱ'}</button>
        </div>
      </div>
    </section>
  );
}

function App() {
  const reduced = useReducedMotion();
  const compact = useCompactMotion();
  const [motionPaused, setMotionPaused] = useState(reduced);
  const disabled = reduced || motionPaused;
  const complexMotionDisabled = disabled || compact;

  const [showJobsModal, setShowJobsModal] = useState(false);

  const handleOpeningComplete = useCallback(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/jobs') {
      setShowJobsModal(true);
    }
  }, []);

  const closeJobsModal = useCallback(() => setShowJobsModal(false), []);

  useMotionInfrastructure({ disabled, compact });

  useEffect(() => setMotionPaused(reduced), [reduced]);
  useEffect(() => {
    document.documentElement.classList.toggle('motion-paused', disabled);
    document.documentElement.classList.toggle('motion-compact', compact);
  }, [compact, disabled]);
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    addEventListener('resize', refresh);
    return () => removeEventListener('resize', refresh);
  }, []);

  return (
    <>
      <Opening reduced={reduced} onComplete={handleOpeningComplete} />
      <a className="skip-link" href="#work">跳至项目</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Arthur，返回首页"><span>©</span> Arthur</a>
        <nav aria-label="主导航">{[['work', 'Work'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => <a href={`#${id}`} key={id}><span className="nav-label"><span>{label}</span><span aria-hidden="true">{label}</span></span></a>)}</nav>
      </header>
      <SiteDetails disabled={disabled} compact={compact} />
      <main>
        <Hero paused={complexMotionDisabled} motionDisabled={disabled} reduced={reduced} toggleMotion={() => setMotionPaused(value => !value)} />

        <section className="intro section-shell" id="intro" data-motion-section>
          <div className="intro-title">
            <p className="eyebrow">A LITTLE INTRODUCTION</p>
            <ScrollFloat disabled={complexMotionDisabled}>从一次请求，到一个可靠的系统。</ScrollFloat>
          </div>
          <AnimatedContent className="intro-aside" distance={60} threshold={.25} disabled={disabled}>
            <p>我是 Arthur，一名专注 Go 后端开发的本科生。关注请求如何流转、数据如何保持一致，以及系统在失败时如何恢复。</p>
            <a className="round-button" data-magnetic data-cursor="action" href="#about">About me <span aria-hidden="true">↗</span></a>
          </AnimatedContent>
        </section>

        <SelectedWork projects={projects} compact={compact} disabled={disabled} />

        <section className="capabilities section-shell" id="skills" data-motion-section>
          <div className="capabilities-title">
            <p className="eyebrow" data-reveal="content">THE FOUNDATION</p>
            <h2 data-reveal="text">
              <span className="reveal-line"><span className="reveal-line-inner">Behind the</span></span>
              <span className="reveal-line"><span className="reveal-line-inner accent">interface.</span></span>
            </h2>
          </div>
          <div className="capability-list">
            {[
              ['01', 'Go & APIs', '围绕请求与服务边界，学习和实践清晰的接口设计。', 'Go · Gin · REST · gRPC'],
              ['02', 'Data & State', '关注数据存储、缓存、状态变化与一致性。', 'MySQL · Redis · SQL'],
              ['03', 'Cloud & Reliability', '持续学习部署、容器与可观测性，用测试验证行为和失败路径。', 'Docker · Cloud Computing · Verification']
            ].map(([index, title, copy, stack]) => <article key={index} data-reveal="row"><span>{index}</span><div><h3>{title}</h3><p>{copy}</p><small>{stack}</small></div></article>)}
          </div>
        </section>

        <AboutEditorial disabled={disabled} compact={compact} />

        <section className="contact" id="contact" data-motion-section>
          <div className="section-shell">
            <div className="contact-topline"><p className="eyebrow" data-reveal="content">THE NEXT CHAPTER / 下一次对话</p><span className="contact-arrival-mark" aria-hidden="true" /></div>
            <h2 data-reveal="text">
              <span className="reveal-line"><span className="reveal-line-inner">Let’s talk</span></span>
              <span className="reveal-line"><span className="reveal-line-inner contact-muted">about it.</span></span>
            </h2>
            <div className="contact-rule"><span className="contact-rule-line" aria-hidden="true" /><a className="round-button blue" data-magnetic data-cursor="action" href="mailto:1784870640@qq.com">Get in touch <span aria-hidden="true">↗</span></a></div>
            <div className="contact-options" data-reveal="content"><a className="text-link" href="mailto:1784870640@qq.com">1784870640@qq.com <span aria-hidden="true">↗</span></a><div><a className="text-link" href="tel:+8618256109164"><span className="contact-option-label">PHONE</span><span>+86 182 5610 9164</span></a><span><span className="contact-option-label">QQ</span><span>1784870640</span></span></div></div>
            <div className="contact-signoff"><span className="contact-signoff-word">Arthur<span>.</span></span><span className="contact-signoff-note">Thanks for stopping by. / 谢谢你的停留。</span></div>
            <footer><span>2026 © Arthur</span><span>China · UTC+8</span><button type="button" onClick={() => setMotionPaused(value => !value)} aria-pressed={disabled} disabled={reduced}>{reduced ? '系统减少动效' : disabled ? '开启动效　▷' : '暂停动效　Ⅱ'}</button><a className="back-top" href="#top">Back to top <span aria-hidden="true">↑</span></a></footer>
          </div>
        </section>
      </main>
      {showJobsModal && <JobsModal onClose={closeJobsModal} />}
    </>
  );
}

export default App;
