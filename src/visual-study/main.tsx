import ReactDOM from 'react-dom/client';
import './study.css';

function Arrow({ down = false }: { down?: boolean }) {
  return <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {down ? <path d="M12 3v17m-7-7 7 7 7-7" /> : <path d="M5 19 19 5M5 5h14v14" />}
  </svg>;
}

function FieldStudy() {
  // A still of the intended field: no listeners, animation loop, or pointer effects.
  const dots = Array.from({ length: 26 * 23 }, (_, i) => {
    const ox = (i % 26) * 23 + 15;
    const oy = Math.floor(i / 26) * 23 + 12;
    const distance = Math.hypot(ox - 365, oy - 262);
    const amplitude = Math.exp(-Math.pow(distance / 125, 2));
    const angle = Math.atan2(oy - 262, ox - 365);
    return <circle key={i} cx={ox + Math.cos(angle) * amplitude * 34}
      cy={oy + Math.sin(angle) * amplitude * 34} r={.85 + amplitude * .55}
      opacity={.11 + amplitude * .2} />;
  });
  return <svg className="hero-field" viewBox="0 0 620 530" aria-hidden="true">
    <g fill="currentColor">{dots}</g>
    <circle cx="365" cy="262" r="41" className="field-orbit" />
    <circle cx="365" cy="262" r="15" className="field-point" />
    <path d="M365 316v85h95" className="field-leader" />
    <circle cx="460" cy="401" r="2.3" className="field-point" />
  </svg>;
}

function SurgeVisual() {
  return <figure className="surge-visual" aria-label="SurgeCart 链路排版示意，非实时数据">
    <div className="cover-meta"><span>SC / TRANSACTION STUDY</span><span>结构示意 · 非实时数据</span></div>
    <div className="surge-visual-body">
      <div className="surge-visual-statement"><span className="cover-overline">A REQUEST IS NOT AN ORDER.</span>
        <p>准入，<br />不等于成交<span>。</span></p>
        <div className="transaction-path"><span>Redis Lua</span><i /> <span>MySQL queue</span><i /><span>Order</span></div>
      </div>
      <div className="transaction-papers" aria-hidden="true">
        <div className="request-paper"><span>01 / REQUEST</span><strong>queued</strong><small>accepted ≠ completed</small><div className="paper-lines" /></div>
        <div className="order-paper"><div className="paper-header"><b>SC</b><span>ORDER TRANSACTION</span></div>
          <span className="paper-status">从排队到落单</span>
          <ol><li><span>01</span>读取请求</li><li><span>02</span>校验与扣减库存</li><li><span>03</span>写入订单</li><li><span>04</span>提交事务</li></ol>
          <div className="paper-footer"><span>MYSQL / SOURCE OF TRUTH</span><svg viewBox="0 0 74 28"><path d="M1 1v26m4-26v26m7-26v26m3-26v26m8-26v26m5-26v26m3-26v26m7-26v26m4-26v26m8-26v26m3-26v26m6-26v26m3-26v26m6-26v26" /></svg></div>
        </div>
      </div>
    </div>
    <figcaption><span>01</span><span>Go · MySQL · Redis</span><span>订单 / 库存 / 失败恢复</span></figcaption>
  </figure>;
}

function OfferVisual() {
  return <figure className="offer-visual" aria-label="Offer 捕手分析流程示意，非产品截图">
    <div className="offer-document">
      <div className="document-masthead"><b>Offer 捕手<span>↗</span></b><small>ANALYSIS NOTES</small></div>
      <p className="document-eyebrow">一份简历，一个岗位。</p>
      <div className="offer-inputs"><span>简历经历<small>RESUME</small></span><i>×</i><span>岗位要求<small>POSITION</small></span></div>
      <div className="document-rule" />
      <div className="offer-level"><b>Fast</b><span>先做快速分析</span><small>01</small></div>
      <div className="offer-level"><b>Deep</b><span>再深入理解匹配关系</span><small>02</small></div>
      <div className="schema-note"><span className="small-dot" /><span>结构校验 → 修复 → 必要时回退</span></div>
    </div>
    <figcaption>分析流程排版示意 · 非产品截图</figcaption>
  </figure>;
}

function WorkflowVisual() {
  return <figure className="workflow-visual" aria-label="Git 提交变化与审查关系示例，非真实运行日志">
    <div className="workflow-label"><span>GIT / REVIEW CONTEXT</span><span>流程示例</span></div>
    <div className="commit-track">
      <div><i /><span>Commit A</span><small>已审查的代码</small></div>
      <div className="commit-connector"><span>代码发生变化</span></div>
      <div><i /><span>Commit B</span><small>需要重新校验</small></div>
    </div>
    <div className="workflow-receipt"><span>workflowcheck</span><span>任务文件 + Git Commit</span><Arrow /></div>
  </figure>;
}

function Portrait() {
  return <figure className="about-photo">
    <picture>
      <source type="image/webp" srcSet="/arthur-editorial-640.webp 640w, /arthur-editorial-960.webp 960w, /arthur-editorial-1440.webp 1440w, /arthur-editorial-2160.webp 2160w" sizes="(max-width: 640px) 62vw, (max-width: 1000px) 32vw, 320px" />
      <img src="/arthur-editorial-960.jpg" width="960" height="1440" loading="eager" decoding="async" alt="Arthur，宋文清，身着深色西装的职业照" />
    </picture>
    <figcaption><span>Arthur / 宋文清</span><span>MA’ANSHAN, CN</span></figcaption>
  </figure>;
}

function Study() {
  return <>
    <div className="study-notice"><span>R1 / STATIC STUDY</span><span>静态设计预览 · 正式网站未替换</span><a href="?specimen=1">字体样张 ↗</a></div>
    <a className="skip-link" href="#work">跳至作品</a>
    <header className="masthead wrap" id="top">
      <a className="wordmark" href="#top" aria-label="Arthur，回到顶部">Arthur<span>.</span></a>
      <nav aria-label="主导航"><a href="#work">Work<span>01</span></a><a href="#about">About<span>02</span></a><a href="#contact">Contact<Arrow /></a></nav>
      <span className="masthead-note">PERSONAL PORTFOLIO / 2026</span>
    </header>
    <main>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-topline"><p><span className="small-dot" /> GO BACKEND DEVELOPMENT</p><span>2027 届 · 软件工程本科</span></div>
        <div className="hero-composition">
          <FieldStudy />
          <h1 id="hero-title">Go backend.<br /><span>In practice.</span></h1>
          <p className="field-caption">从项目里的具体问题开始。<span>ORDERS · MODELS · WORKFLOWS</span></p>
        </div>
        <div className="hero-bottom">
          <p>我是 Arthur。最近一边准备求职，一边完善电商后端，也继续维护自己的 AI 求职工具。</p>
          <a className="hero-work-link" href="#work" aria-label="看看我在做什么，前往作品"><span>看看我在做什么<small>EXPLORE MY WORK</small></span><span className="circle-arrow"><Arrow down /></span></a>
        </div>
        <nav className="project-index" aria-label="项目快速入口">
          <a href="#surgecart"><span>01</span><b>SurgeCart</b><small>电商后端</small><Arrow /></a>
          <a href="#offer"><span>02</span><b>Offer 捕手</b><small>AI 求职工具</small><Arrow /></a>
          <a href="#workflow"><span>03</span><b>Agent Workflow</b><small>开发协作工具</small><Arrow /></a>
        </nav>
      </section>

      <section className="work-section wrap" id="work" aria-labelledby="work-title">
        <div className="section-heading"><div><p className="eyebrow">01 / SELECTED WORK</p><h2 id="work-title">三个项目，<br className="mobile-break" />三个具体问题。</h2></div><p>从订单与库存，到模型输出，<br />再到 AI 协作中的交接与审查。</p></div>
        <article className="flagship" id="surgecart" aria-labelledby="surge-title">
          <div className="project-heading"><div><p className="eyebrow">01 / PERSONAL PROJECT</p><h3 id="surge-title">SurgeCart</h3><p>电商交易与秒杀系统</p></div><span className="project-discipline">BACKEND ENGINEERING</span></div>
          <SurgeVisual />
          <div className="surge-notes" id="surge-notes">
            <div className="project-summary"><h4>重复请求，<br />不能重复扣库存。</h4><p>从普通订单做起，我后来花了更多时间处理重复下单、库存扣减和失败恢复。</p></div>
            <dl className="decision-list"><div><dt>关键选择</dt><dd>Redis Lua 控制准入，MySQL 请求表排队，再异步落单。</dd></div><div><dt>怎样检查</dt><dd>并发测试与库存对账，检查接口返回之后的最终结果。</dd></div><div><dt>目前边界</dt><dd>支付使用 Mock；不把准入成功当作订单已经完成。</dd></div></dl>
          </div>
          <div className="project-footnote"><span>Go / GoFrame / MySQL / Redis / Prometheus</span><a className="text-link" href="#contact">聊聊这个项目 <Arrow /></a></div>
        </article>

        <article className="offer-project" id="offer" aria-labelledby="offer-title">
          <div className="offer-copy"><p className="eyebrow">02 / PERSONAL PROJECT</p><h3 id="offer-title">Offer 捕手</h3><p className="project-subtitle">AI 求职匹配与简历优化工具</p><h4>来自我自己的<br />求职需要。</h4><p>把简历与岗位放在一起分析。我组织并推进 Go 后端、React 前端、LLM 接入和部署，也处理模型输出不符合约定的问题。</p><p className="quiet-copy">结构校验通过，并不等于内容一定正确。这是维护过程中一直需要注意的边界。</p><span className="stack">Go / React / MySQL / LLM API</span><a className="text-link" href="#contact">交流产品与实现 <Arrow /></a></div>
          <OfferVisual />
        </article>

        <article className="workflow-project" id="workflow" aria-labelledby="workflow-title">
          <div className="workflow-title"><p className="eyebrow">03 / PERSONAL PROJECT</p><h3 id="workflow-title">Agent<br />Workflow</h3><span className="stack">Go / Git / 自动化测试</span></div>
          <div className="workflow-story"><h4>代码变了，<br />审查结论还有效吗？</h4><p>使用 AI Agent 开发时，任务交接、代码修改和审查结论容易对不上。我设计协作流程，并开发 Go 校验工具，把任务和审查结果关联到具体提交。</p><WorkflowVisual /><a className="text-link" href="#contact">聊聊交接与验证 <Arrow /></a></div>
        </article>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-title">
        <div className="wrap">
          <div className="section-heading about-heading"><div><p className="eyebrow">02 / THE PERSON</p><h2 id="about-title">A little about me.</h2></div><span className="about-name">Arthur / 宋文清</span></div>
          <div className="about-layout">
            <p className="portrait-margin">BASED IN<br />MA’ANSHAN,<br />CHINA.</p>
            <Portrait />
            <div className="about-copy"><h3>还在学习，<br />也在认真做项目。</h3><p>我在马鞍山学院读软件工程，预计 2027 年 7 月毕业。目前主要做 Go 后端，长期关注云计算。</p><p>遇到不理解的问题，我会查源码、看技术资料，也听工程师的访谈。工程日记里会记下做过的判断，以及后来发现自己想错的地方。</p><p>项目有 AI Agent 参与实现。我负责方案取舍、推进和验收，也需要解释哪些实现该保留，哪些还没有验证充分。</p><div className="credential-note"><span>ALIBABA CLOUD / ACP</span><small>Cloud Computing · 有效至 2027.10</small></div></div>
            <div className="experience"><span className="eyebrow">A SUMMER IN HANGZHOU</span><div><h4>Go 后端开发实习</h4><p>杭州智航星辰人工智能科技有限公司</p><p>参与企业课程平台开发，跟进 AI 客服系统的问题定位、修复和联调。</p></div><time>2026.07—08</time></div>
            <div className="off-clock"><p>关上电脑之后。</p><ul><li><span>01</span>骑行<small>Cycling</small></li><li><span>02</span>网球<small>Tennis</small></li><li><span>03</span>影视剧<small>Films & Series</small></li></ul></div>
          </div>
        </div>
      </section>
    </main>

    <footer className="contact-section" id="contact" aria-labelledby="contact-title">
      <div className="wrap"><div className="contact-top"><p className="eyebrow">03 / GET IN TOUCH</p><span>下一次对话，从这里开始。</span></div>
        <div className="contact-title-row"><h2 id="contact-title">Let’s talk<span>.</span></h2><a className="contact-orb" href="mailto:1784870640@qq.com" aria-label="给 Arthur 发邮件"><Arrow /></a></div>
        <div className="contact-details"><p>项目、工作机会，<br />或者你发现网站哪里值得改进。</p><div><span className="contact-label">EMAIL</span><a className="email-link" href="mailto:1784870640@qq.com">1784870640@qq.com <Arrow /></a><div className="secondary-contact"><a href="tel:+8618256109164">+86 182 5610 9164</a><span>QQ / 1784870640</span></div></div></div>
        <div className="colophon"><a className="wordmark" href="#top">Arthur<span>.</span></a><span>© 2026 · A WORK IN PROGRESS</span><a className="back-top" href="#top">回到顶部 <Arrow /></a></div>
      </div>
    </footer>
  </>;
}

function Specimen() {
  return <main className="specimen wrap"><a className="text-link" href={location.pathname}>← 返回静态预览</a><p className="eyebrow">R1 / TYPOGRAPHY STUDY</p><h1>让真实内容决定字体。</h1><p className="specimen-intro">两份样张使用相同字号、行高与内容。正文中文共用 Noto Sans SC；只比较英文的字形和中英文组合。正式预览选用 Instrument Sans，不同时加载两套英文字体。</p><div className="specimen-grid">{['Instrument', 'Inter'].map(font => <section className={`font-sample sample-${font.toLowerCase()}`} key={font}><p className="eyebrow">{font === 'Instrument' ? 'SELECTED / 采用' : 'COMPARISON / 对照'}</p><h2>{font === 'Instrument' ? 'Instrument Sans' : 'Inter'}</h2><p className="sample-brand">Arthur<span>.</span></p><p className="sample-title">Go backend.<br />In practice.</p><p className="sample-project">SurgeCart<br />Offer 捕手<br />Agent Workflow</p><p className="sample-body">我是 Arthur，2027 届软件工程本科生。最近在完善电商后端，也继续维护自己的 AI 求职工具。重复请求不能重复扣库存；结构校验通过，也不等于内容一定正确。</p><p className="sample-details">2026.07—08 / 2027.07<br />1784870640@qq.com<br />+86 182 5610 9164</p><small>字重 400 / 500 / 600 · SIL OFL 1.1</small></section>)}</div></main>;
}

const specimen = new URLSearchParams(location.search).has('specimen');
if (specimen) document.documentElement.classList.add('specimen-mode');
ReactDOM.createRoot(document.getElementById('root')!).render(specimen ? <Specimen /> : <Study />);
