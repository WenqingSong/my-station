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
    title: 'SurgeCart',
    subtitle: '电商交易与秒杀系统',
    preview: {
      note: '秒杀链路：准入不等于下单成功。',
      steps: [['Redis Lua', '准入'], ['MySQL 请求表', '排队'], ['订单事务', '落单']]
    },
    category: '个人项目 · Go Backend',
    label: '订单与库存',
    heading: <>重复请求，<br />不能重复扣库存。</>,
    description: '从普通订单做起，我后来花了更多时间处理重复下单、库存扣减和失败恢复。秒杀先由 Redis Lua 控制准入，再通过 MySQL 请求表排队、异步落单。我用并发测试和库存对账检查最终结果。',
    focus: '为什么选 MySQL 请求表，而不是直接引入 Kafka？支付目前使用 Mock，不接真实交易。',
    stack: 'Go / GoFrame / MySQL / Redis / Prometheus'
  },
  {
    id: 'backend',
    index: '02',
    title: 'Agent Workflow',
    subtitle: '基于 Git 的多 Agent 协作工具',
    preview: {
      note: '把交接与审查关联到具体提交。',
      steps: [['任务文件', '交接'], ['Git Commit', '绑定'], ['Go 校验器', '检查']]
    },
    category: '个人项目 · Developer Tooling',
    label: '任务与审查',
    heading: <>代码变了，<br />审查结论还有效吗？</>,
    description: '用 AI Agent 开发时，我发现任务交接、代码修改和审查结论容易对不上。于是设计了多角色协作流程，并开发 Go 校验器，把任务状态和审查结果关联到具体 Git Commit，在交接前检查是否发生变化。',
    focus: '一次审查通过之后，怎样发现后续提交已经改变了被审查的代码？',
    stack: 'Go / Git / 自动化测试'
  },
  {
    id: 'matching',
    index: '03',
    title: 'Offer 捕手',
    subtitle: 'AI 求职匹配与简历优化工具',
    preview: {
      note: '结构不合约定，先修复，再回退。',
      steps: [['Schema', '校验'], ['Repair', '修复一次'], ['业务流程', '必要时回退']]
    },
    category: '个人项目 · AI Application',
    label: '简历与岗位',
    heading: <>模型的回答，<br />先检查再使用。</>,
    description: '这个网站来自我自己的求职需求，已经做过公网部署，还在维护。我组织并推进 Go 后端、React 前端和 LLM 接入。模型输出不符合约定时，先做 Schema 校验与修复；仍不通过，再由业务流程回退。',
    focus: '为什么分 Fast 和 Deep 两级分析？结构校验通过，也不等于内容一定正确。',
    stack: 'Go / React / MySQL / LLM API / JSON Schema'
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

type EntryIntent = 'offer' | 'jobs';

// Offer 捕手入口：仅识别明确的 entry=offer 查询参数，或旧 /jobs 路径（独立开发降级）。
function detectEntryIntent(location: Location): EntryIntent | null {
  if (new URLSearchParams(location.search).get('entry') === 'offer') return 'offer';
  if (location.pathname.replace(/\/+$/, '') === '/jobs') return 'jobs';
  return null;
}

// 一次性消费入口：清除 entry 参数、将 /jobs 规范化到 /，同时保留其他查询参数与 Hash。
function buildConsumedUrl(location: Location): string | null {
  let pathname = location.pathname;
  const params = new URLSearchParams(location.search);
  let changed = false;

  if (pathname.replace(/\/+$/, '') === '/jobs') {
    pathname = '/';
    changed = true;
  }
  if (params.has('entry')) {
    params.delete('entry');
    changed = true;
  }

  if (!changed) return null;
  const search = params.toString();
  return pathname + (search ? `?${search}` : '') + location.hash;
}

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

  // 入口意图仅在初始化时捕获一次；StrictMode 双渲染下 ref 保持同一值，不会重复识别。
  const entryIntentRef = useRef<EntryIntent | null | undefined>(undefined);
  if (entryIntentRef.current === undefined) {
    entryIntentRef.current = detectEntryIntent(window.location);
  }

  const handleOpeningComplete = useCallback(() => {
    const intent = entryIntentRef.current;
    if (!intent) return;
    entryIntentRef.current = null; // 一次性消费，保证重复完成回调不会重复打开弹窗
    const nextUrl = buildConsumedUrl(window.location);
    if (nextUrl !== null) {
      history.replaceState(history.state, '', nextUrl);
    }
    setShowJobsModal(true);
  }, []);

  const closeJobsModal = useCallback(() => {
    setShowJobsModal(false);
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
        <FirstHero projects={projects} paused={complexMotionDisabled} motionDisabled={disabled} reduced={reduced} toggleMotion={() => setMotionPaused(value => !value)} />

        <section className="intro section-shell" id="intro" data-motion-section>
          <div className="intro-title">
            <p className="eyebrow">A LITTLE INTRODUCTION</p>
            <ScrollFloat disabled={complexMotionDisabled}>最近主要在忙这些事情。</ScrollFloat>
          </div>
          <AnimatedContent className="intro-aside" distance={60} threshold={.25} disabled={disabled}>
            <p>目前花时间最多的是 SurgeCart 的订单、秒杀和失败恢复，也在维护 Offer 捕手。使用 AI Agent 开发时遇到的交接问题，让我开始做 Agent Workflow。<br /><br />2026 年 7—8 月，我在杭州智航星辰人工智能科技有限公司做 Go 后端实习，参与企业课程平台开发，跟进 AI 客服系统的问题定位、修复和联调。</p>
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
              ['01', 'Go & Backend', '主要用 Go 和 GoFrame 写 REST API。在电商项目里实践事务、库存条件更新、幂等和异步落单，再用测试检查重复请求和失败路径。', 'Go · GoFrame · MySQL · Redis'],
              ['02', 'AI & Tooling', '做过 LLM 结构化输出校验与回退，也在用 Git 和 Go 工具检查 Agent 的任务交接与代码审查。AI 帮我提效，但不能代替验证。', 'JSON Schema · Git · Go'],
              ['03', 'Deployment & Cloud', '用 Docker Compose 和 Nginx 部署过项目，接触过 Prometheus 指标监控。长期关注云计算，Kubernetes 还在学习中。', 'Docker Compose · Nginx · Prometheus']
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
            <div className="contact-signoff"><span className="contact-signoff-word">Arthur<span>.</span></span><span className="contact-signoff-note">聊项目、工作机会，或告诉我网站哪里需要改进。</span></div>
            <footer><span>2026 © Arthur</span><span>China · UTC+8</span><button type="button" onClick={() => setMotionPaused(value => !value)} aria-pressed={disabled} disabled={reduced}>{reduced ? '系统减少动效' : disabled ? '开启动效　▷' : '暂停动效　Ⅱ'}</button><a className="back-top" href="#top">Back to top <span aria-hidden="true">↑</span></a></footer>
          </div>
        </section>
      </main>
      {showJobsModal && <JobsModal onClose={closeJobsModal} disabled={disabled} />}
    </>
  );
}

export default App;
