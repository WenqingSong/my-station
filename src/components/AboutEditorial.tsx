import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION } from '../motion';
import './about-editorial.css';

export default function AboutEditorial({ disabled, compact }: { disabled: boolean; compact: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || disabled) return;
    const context = gsap.context(() => {
      const image = root.querySelector('.portrait-window');
      // Move the clipping edge, never soften or scale the portrait pixels.
      gsap.fromTo(image, { clipPath: 'inset(0% 0% 100% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: compact ? MOTION.ease.reveal : 'none', duration: .95,
        scrollTrigger: compact
          ? { trigger: image, start: 'top 86%', once: true }
          : { trigger: image, start: 'top 90%', end: 'top 30%', scrub: .55 }
      });
      if (!compact) {
        gsap.fromTo('.about-closing-inner', { xPercent: 3.5 }, {
          xPercent: 0, ease: 'none',
          scrollTrigger: { trigger: '.about-closing', start: 'top bottom', end: 'top 45%', scrub: .7 }
        });
      }
    }, root);
    let alive = true;
    document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
    return () => { alive = false; context.revert(); };
  }, [disabled, compact]);

  return <section className={`about-editorial section-shell ${disabled ? 'about-still' : ''}`} id="about" ref={rootRef} aria-labelledby="about-title" data-motion-section>
    <div className="about-masthead"><p>THE PERSON BEHIND THE CODE</p><span>ARTHUR / A PERSONAL NOTE</span></div>
    <div className="about-spread">
      <h2 className="about-title" id="about-title" data-reveal="text"><span className="reveal-line"><span className="reveal-line-inner">Always curious<span className="about-period">.</span></span></span></h2>

      <p className="about-margin-note">Based in<br />Ma’anshan,<br />China.</p>

      <figure className="about-portrait">
        <picture className="portrait-window">
          <source type="image/webp" srcSet="/arthur-editorial-640.webp 640w, /arthur-editorial-960.webp 960w, /arthur-editorial-1440.webp 1440w, /arthur-editorial-2160.webp 2160w" sizes="(max-width: 620px) 72vw, (max-width: 900px) 42vw, (min-width: 1600px) 440px, 32vw" />
          <img src="/arthur-editorial-960.jpg"
            srcSet="/arthur-editorial-640.jpg 640w, /arthur-editorial-960.jpg 960w, /arthur-editorial-1440.jpg 1440w, /arthur-editorial-2160.jpg 2160w"
            sizes="(max-width: 620px) 72vw, (max-width: 900px) 42vw, (min-width: 1600px) 440px, 32vw"
            width="960" height="1440" loading="lazy" decoding="async"
            alt="Arthur 身着深色西装，站在深蓝色背景前" />
        </picture>
        <figcaption><span>Arthur</span><span>宋文清</span></figcaption>
      </figure>

      <div className="about-narrative" data-reveal="content">
        <p className="about-small-label">A LITTLE ABOUT ME</p>
        <h3>Hi, I’m Arthur.</h3>
        <p>中文名宋文清，目前就读于马鞍山学院，预计 2027 年 7 月毕业。</p>
        <p>我的方向是 Go 后端开发，长期关注云计算。我喜欢理解系统如何运作，也享受把一个问题慢慢想清楚的过程。</p>
      </div>

      <aside className="about-certification" aria-label="阿里云认证" data-reveal="content">
        <span className="certificate-mark" aria-hidden="true">[&nbsp;]</span>
        <div><p>Alibaba Cloud <span>· ACP</span></p><span>Certified Professional · Cloud Computing</span><small>有效至 2027 年 10 月</small></div>
      </aside>

      <p className="about-closing"><span className="about-closing-inner">Still becoming.</span></p>

      <div className="about-offclock" data-reveal="content">
        <div className="about-offclock-intro"><p className="about-small-label">OFF THE CLOCK</p><p>代码之外，也有值得投入的事。</p></div>
        <ul className="about-pursuits">
          <li><span className="pursuit-mark mark-cycling" aria-hidden="true" /><div><span>Cycling</span><small>骑行</small></div></li>
          <li><span className="pursuit-mark mark-tennis" aria-hidden="true" /><div><span>Tennis</span><small>网球</small></div></li>
          <li><span className="pursuit-mark mark-film" aria-hidden="true" /><div><span>Films &amp; Series</span><small>影视剧</small></div></li>
        </ul>
      </div>
    </div>
  </section>;
}
