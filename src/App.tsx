import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimatedContent from './components/AnimatedContent';
import ScrollFloat from './components/ScrollFloat';
import SelectedWork from './components/SelectedWork';
import AboutEditorial from './components/AboutEditorial';
import SiteDetails from './components/SiteDetails';
import FirstHero from './components/FirstHero';
import JobsModal from './components/JobsModal';
import { useModalFocus } from './useModalFocus';
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
  const [visible, setVisible] = useState(() => !reduced && (!location.hash || location.hash === '#top'));
  const rootRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const completed = useRef(false);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    document.documentElement.classList.remove('intro-locked');
    gsap.set(document.querySelectorAll('.hero-opening-target'), { clearProps: 'transform,opacity' });
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  const skip = useCallback(() => {
    timeline.current?.kill();
    finish();
  }, [finish]);

  useModalFocus(rootRef, visible && !reduced, skip);

  useLayoutEffect(() => {
    if (!visible || !rootRef.current) {
      finish();
      return;
    }
    if (reduced) {
      finish();
      return;
    }
    document.documentElement.classList.add('intro-locked');
    let cancelled = false;
    let begun = false;
    let context: gsap.Context | undefined;
    const begin = () => {
      if (cancelled || begun || !rootRef.current) return;
      begun = true;
      const heroTargets = document.querySelectorAll('.hero-opening-target');
      gsap.set(heroTargets, { opacity: 0, y: 28 });
      context = gsap.context(() => {
        const sequence = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish });
        timeline.current = sequence;
        sequence
          .from('.opening-meta > *', { y: 14, opacity: 0, duration: .3, stagger: .04 })
          .from('.opening-axis', { scaleX: 0, transformOrigin: 'center', duration: .34 }, '-=.2');

        greetings.forEach((_, index) => {
          const greeting = `.opening-greeting[data-index="${index}"]`;
          const tick = `.opening-trace span:nth-child(${index + 1})`;
          const enter = index === 0 ? .06 : index === greetings.length - 1 ? .05 : .035;
          const hold = index === 0 ? .04 : index === greetings.length - 1 ? .05 : .02;
          const leave = index === 0 ? .05 : index === greetings.length - 1 ? .045 : .04;
          sequence
            .set(greeting, { visibility: 'visible' })
            .fromTo(greeting,
              { clipPath: 'inset(0 100% 0 0)', scaleX: .58, xPercent: -3, transformOrigin: '50% 50%' },
              { clipPath: 'inset(0 0% 0 0)', scaleX: 1.07, xPercent: 0, duration: enter, ease: 'power2.out' })
            .to(greeting, { scaleX: .92, letterSpacing: '-.045em', duration: hold, ease: 'sine.inOut' })
            .to(tick, { scaleX: 1, opacity: 1, duration: hold, ease: 'power2.out' }, '<')
            .to(greeting, { clipPath: 'inset(0 0 0 100%)', xPercent: 3, duration: leave, ease: 'power2.in' })
            .set(greeting, { visibility: 'hidden' });
        });

        sequence
          .to('.opening-trace span', { scaleX: 0, transformOrigin: 'center', duration: .14, stagger: { each: .006, from: 'edges' }, ease: 'power3.in' })
          .to('.opening-axis', { scaleX: .08, backgroundColor: '#3047ff', duration: .2, ease: 'power3.inOut' }, '<+.02')
          .set('.opening-final', { visibility: 'visible' })
          .fromTo('.opening-final',
            { clipPath: 'inset(0 100% 0 0)', scaleX: .72, transformOrigin: '50% 50%' },
            { clipPath: 'inset(0 0% 0 0)', scaleX: 1, duration: .48, ease: 'power4.out' })
          .from('.opening-final-dot', { scale: 0, rotate: -120, duration: .4, ease: 'back.out(2.4)' }, '-=.3')
          .to('.opening-meta, .opening-trace, .opening-final-name', { opacity: 0, y: -14, duration: .28, ease: 'power2.in' }, '+=.18')
          .to('.opening-final-dot', { x: () => innerWidth * .105, y: () => innerHeight * .055, scale: .6, duration: .44, ease: 'power3.inOut' }, '-=.24')
          .addLabel('curtain', '-=.05')
          .to('.opening-panel-top', { yPercent: -101, duration: .78, ease: 'power4.inOut' }, 'curtain')
          .to('.opening-panel-bottom', { yPercent: 101, duration: .78, ease: 'power4.inOut' }, 'curtain')
          .to('.opening-final-dot', { opacity: 0, scale: .2, duration: .24, ease: 'power2.in' }, 'curtain+=.34')
          .to(heroTargets, { opacity: 1, y: 0, duration: .58, stagger: .028, ease: 'power3.out' }, 'curtain+=.12');
      }, rootRef);
    };
    const deadline = window.setTimeout(begin, 650);
    document.fonts.ready.then(begin);
    return () => {
      cancelled = true;
      clearTimeout(deadline);
      timeline.current?.kill();
      context?.revert();
      gsap.set(document.querySelectorAll('.hero-opening-target'), { clearProps: 'transform,opacity' });
      document.documentElement.classList.remove('intro-locked');
    };
  }, [finish, reduced, visible]);

  if (!visible) return null;
  return (
    <div className="opening" ref={rootRef} role="dialog" aria-modal="true" aria-label="多语言问候开场，可跳过或按 Escape 关闭" data-lenis-prevent>
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


function App() {
  const reviewStill = new URLSearchParams(location.search).get('hero-review') === 'still';
  const reduced = useReducedMotion();
  const compact = useCompactMotion();
  const [motionPaused, setMotionPaused] = useState(reduced);
  const disabled = reduced || motionPaused || reviewStill;
  const complexMotionDisabled = disabled || compact;

  const [showJobsModal, setShowJobsModal] = useState(false);

  const handleOpeningComplete = useCallback(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/jobs') {
      setShowJobsModal(true);
    }
  }, []);

  const closeJobsModal = useCallback(() => {
    setShowJobsModal(false);
    history.replaceState(null, '', `/${location.hash}`);
  }, []);

  useMotionInfrastructure({ disabled, compact });

  useEffect(() => setMotionPaused(reduced), [reduced]);
  useEffect(() => {
    document.documentElement.classList.toggle('motion-paused', disabled);
    document.documentElement.classList.toggle('motion-compact', compact);
  }, [compact, disabled]);

  return (
    <>
      <Opening reduced={reduced || reviewStill} onComplete={handleOpeningComplete} />
      <a className="skip-link" href="#work">跳至项目</a>
      <header className="site-header restored-site-header">
        <a className="brand" href="#top" aria-label="Arthur，返回首页"><span className="restored-brand-mark" aria-hidden="true" />ARTHUR / 27</a>
        <nav aria-label="主导航">{[['top', 'Index'], ['work', 'Work'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}</nav>
        <span className="restored-availability">Graduating · 2027</span>
      </header>
      <SiteDetails disabled={disabled} compact={compact} />
      <main>
        <FirstHero paused={complexMotionDisabled} motionDisabled={disabled} reduced={reduced} toggleMotion={() => setMotionPaused(value => !value)} />

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
      {showJobsModal && <JobsModal onClose={closeJobsModal} disabled={disabled} />}
    </>
  );
}

export default App;
