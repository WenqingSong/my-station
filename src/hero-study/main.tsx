import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './hero-study.css';

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SurgeCartCover() {
  return <div className="sc-cover" aria-hidden="true">
    <div className="sc-cover-top"><span>SURGE / CART</span><span>SC—01</span></div>
    <div className="sc-orbit sc-orbit-one" /><div className="sc-orbit sc-orbit-two" />
    <div className="sc-backplate"><span>STATE / CONSISTENCY</span></div>
    <div className="sc-receipt">
      <div className="sc-receipt-head"><span className="sc-symbol">s<span>c</span></span><span>ORDER<br />LIFECYCLE</span></div>
      <div className="sc-receipt-title">Every order.<br />Every step.</div>
      <div className="sc-receipt-rule" />
      <div className="sc-step"><span>01</span><b>Created</b><i /></div>
      <div className="sc-step"><span>02</span><b>Paid</b><i /></div>
      <div className="sc-step"><span>03</span><b>Shipped</b><i /></div>
      <div className="sc-step"><span>04</span><b>Received</b><i /></div>
      <div className="sc-receipt-bottom"><span>GO / MYSQL / REDIS</span><div className="sc-bars" /></div>
    </div>
    <span className="sc-cover-number">01</span>
    <div className="sc-cover-bottom"><span>COMMERCE SYSTEM</span><span>→</span></div>
  </div>;
}

function HeroStudy() {
  return <div className="arthur-study">
    <a className="study-skip" href="#hero-content">跳到首页内容</a>
    <header className="arthur-header">
      <a href="/" target="_top" className="arthur-wordmark" aria-label="Arthur，返回当前网站"><span className="arthur-monogram" aria-hidden="true">a</span><span>Arthur<span className="wordmark-dot">.</span></span></a>
      <nav aria-label="主导航"><a href="/#work" target="_top">Work <span>↗</span></a><a href="/#about" target="_top">About</a><a href="mailto:1784870640@qq.com">Let’s talk <span>↗</span></a></nav>
      <span className="header-edition">PERSONAL PORTFOLIO / 2026</span>
    </header>
    <main id="hero-content" className="arthur-hero">
      <div className="hero-paper-grid" aria-hidden="true" />
      <div className="arthur-hero-topline"><span><i /> GO BACKEND DEVELOPER</span><span>MA’ANSHAN, CHINA</span></div>
      <div className="arthur-composition">
        <div className="arthur-intro">
          <p className="arthur-hello">你好，I’m</p>
          <h1>Arthur<span>.</span></h1>
          <div className="arthur-role"><span className="role-arrow" aria-hidden="true">↳</span><p>Backend development.<br /><span>Cloud curiosity.</span></p></div>
          <div className="arthur-intro-bottom">
            <p className="arthur-bio">用 Go 构建后端，探索云计算。<br />在真实项目里，理解系统如何运转。</p>
            <div className="arthur-actions"><a className="arthur-work-link" href="/#work" target="_top"><span>查看我的作品</span><span className="work-link-icon"><Arrow /></span></a><a className="arthur-about-link" href="/#about" target="_top">认识我 <Arrow diagonal /></a></div>
          </div>
        </div>
        <figure className="arthur-featured">
          <div className="featured-label"><span>SELECTED PRACTICE</span><span>01 / SURGECART</span></div>
          <a className="featured-cover-link" href="https://cnb.cool/framework-station/my-shop" target="_blank" rel="noopener noreferrer" aria-label="查看 SurgeCart 项目仓库（新标签页）"><SurgeCartCover /><span className="cover-open"><Arrow diagonal /></span></a>
          <figcaption><div><a href="https://cnb.cool/framework-station/my-shop" target="_blank" rel="noopener noreferrer">SurgeCart <Arrow diagonal /></a><p>订单、库存与秒杀背后的一致性。</p></div><span className="featured-tag">Go / GoFrame<br />MySQL / Redis</span></figcaption>
          <span className="concept-note">项目概念主视觉 · 非产品界面或实时数据</span>
        </figure>
      </div>
      <footer className="arthur-hero-footer"><span>CODE, WITH A HUMAN SIDE.</span><span className="arthur-interests">骑行 / 网球 / 影视</span><a href="/#work" target="_top">EXPLORE THE WORK <span aria-hidden="true">↓</span></a></footer>
    </main>
  </div>;
}

const versions = [
  { id: 'current', label: '恢复版', url: '/?hero-review=still#top', note: '已恢复第一版 Hero · 此处为暂停动画的构图对照，完整交互请打开网站首页。' },
  { id: 'first', label: '第一版', url: '/hero-study/archive-v1/index.html', note: '历史原稿 · 保留当时的布局与交互；其中示意数据、姓名和内容并非当前资料。' },
  { id: 'new', label: '未采用稿', url: '/hero-study/?view=new', note: '未采用的静态构图稿，仅留存对照。' },
] as const;

function Comparison() {
  const [version, setVersion] = useState<(typeof versions)[number]['id']>('current');
  const [mobile, setMobile] = useState(false);
  const selected = versions.find(item => item.id === version)!;
  return <div className="hero-comparison">
    <header className="comparison-toolbar">
      <div className="comparison-title"><strong>Arthur<span> / </span>Hero</strong><small>01 — 构图与字体</small></div>
      <div className="comparison-versions" role="group" aria-label="选择对照版本">{versions.map(item => <button key={item.id} type="button" aria-pressed={version === item.id} onClick={() => setVersion(item.id)}>{item.label}</button>)}</div>
      <div className="comparison-tools"><button type="button" aria-pressed={mobile} onClick={() => setMobile(value => !value)}>{mobile ? '手机 · 390' : '全宽预览'}<span aria-hidden="true">{mobile ? '▯' : '▭'}</span></button><a href={selected.url} target="_blank" rel="noopener noreferrer">独立打开 <span aria-hidden="true">↗</span></a></div>
    </header>
    <p className="comparison-note" role="status">{selected.note}</p>
    <div className={`comparison-stage${mobile ? ' comparison-mobile' : ''}`}><iframe key={`${version}-${mobile}`} src={selected.url} title={`${selected.label} Hero ${mobile ? '手机' : '全宽'}预览`} /></div>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('view') === 'new' ? <HeroStudy /> : <Comparison />);
