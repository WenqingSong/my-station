import './about-editorial.css';

export default function AboutEditorial() {
  return <section className="about-editorial about-note section-shell" id="about" aria-labelledby="about-title">
    <span id="skills" className="legacy-section-anchor" aria-hidden="true" />
    <div className="about-masthead"><p>02 / A PERSONAL NOTE</p><span>MA’ANSHAN, CHINA</span></div>
    <div className="about-spread">
      <h2 className="about-title" id="about-title">Hi, I’m Arthur<span className="about-period">.</span></h2>
      <p className="about-margin-note">宋文清<br />软件工程本科在读<br />预计 2027 年 7 月毕业</p>
      <figure className="about-portrait">
        <picture className="portrait-window">
          <source type="image/webp" srcSet="/arthur-editorial-640.webp 640w, /arthur-editorial-960.webp 960w, /arthur-editorial-1440.webp 1440w, /arthur-editorial-2160.webp 2160w" sizes="(max-width: 620px) 72vw, (max-width: 900px) 42vw, 32vw" />
          <img src="/arthur-editorial-960.jpg" srcSet="/arthur-editorial-640.jpg 640w, /arthur-editorial-960.jpg 960w, /arthur-editorial-1440.jpg 1440w, /arthur-editorial-2160.jpg 2160w" sizes="(max-width: 620px) 72vw, (max-width: 900px) 42vw, 32vw"
            width="960" height="1440" loading="lazy" decoding="async" alt="Arthur 身着深色西装，站在深蓝色背景前" />
        </picture>
        <figcaption><span>Arthur / 宋文清</span><span>PORTRAIT</span></figcaption>
      </figure>
      <div className="about-narrative">
        <p className="about-lead">在马鞍山学院读软件工程。<br />现在主要写 Go，也在继续学习云计算。</p>
        <p>实习之后，我开始写工程日记：记录问题、当时的判断，以及后来发现自己想错的地方。也会读源码、听工程师的访谈，补上自己还不了解的东西。</p>
        <p>AI Agent 帮我实现和验证，但方案取舍、验收和后续维护，仍然是我要负责的事。</p>
        <div className="about-experience">
          <p className="about-small-label">一次团队开发经历 / 2026.07—08</p>
          <h3>Go 后端开发实习</h3>
          <p>杭州智航星辰人工智能科技有限公司</p>
          <p>参与企业课程平台开发，跟进 AI 客服系统的问题定位、修复和联调。</p>
        </div>
      </div>
      <div className="about-offclock">
        <div className="about-offclock-intro"><p className="about-small-label">OFF THE CLOCK</p><p>关上电脑以后。</p></div>
        <ul className="about-pursuits">
          <li><span className="pursuit-mark mark-cycling" aria-hidden="true" /><div><span>Cycling</span><small>骑行</small></div></li>
          <li><span className="pursuit-mark mark-tennis" aria-hidden="true" /><div><span>Tennis</span><small>网球</small></div></li>
          <li><span className="pursuit-mark mark-film" aria-hidden="true" /><div><span>Films &amp; Series</span><small>影视剧</small></div></li>
        </ul>
      </div>
    </div>
  </section>;
}
