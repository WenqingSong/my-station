import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { createStoryTween } from '../scroll-story';
import { CONTACT_EMAIL, copyEmail } from './copy-contact';

export default function Contact({ disabled, compact, reduced, toggleMotion }: { disabled: boolean; compact: boolean; reduced: boolean; toggleMotion: () => void }) {
  const root = useRef<HTMLElement>(null);
  const [copyState, setCopyState] = useState<'idle' | 'pending' | 'copied' | 'manual'>('idle');
  const input = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  const alive = useRef(true);
  const copying = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(resetTimer.current); }; }, []);
  useEffect(() => { if (copyState === 'manual') { input.current?.focus(); input.current?.select(); } }, [copyState]);
  useLayoutEffect(() => {
    if (disabled || !root.current) return;
    const context = gsap.context(() => {
      createStoryTween(root.current!.querySelector('.finale-title-line'), 'closing', compact, {
        trigger: root.current, start: 'top bottom', end: 'clamp(top 45%)', scrub: true
      });
    }, root);
    return () => context.revert();
  }, [disabled, compact]);
  const copy = async () => {
    if (copying.current) return;
    copying.current = true;
    clearTimeout(resetTimer.current);
    setCopyState('pending');
    const result = await copyEmail(navigator.clipboard);
    copying.current = false;
    if (!alive.current) return;
    setCopyState(result);
    if (result === 'copied') resetTimer.current = setTimeout(() => setCopyState('idle'), 3500);
  };
  return <section ref={root} className="contact contact-finale" id="contact" aria-labelledby="contact-title">
    <div className="section-shell">
      <div className="contact-topline"><p className="eyebrow">03 / CONTACT</p><a className="finale-back" href="#top">返回顶部 <span aria-hidden="true">↑</span></a></div>
      <div className="finale-heading"><h2 id="contact-title"><span className="finale-title-line">Let’s <span className="title-ending">talk<span className="finale-period">.</span></span></span></h2><p>聊聊项目、工作机会，<br />或告诉我网站哪里需要改进。</p></div>
      <div className="finale-email-row">
        <a className="finale-email" href={`mailto:${CONTACT_EMAIL}`} aria-label={`发送邮件至 ${CONTACT_EMAIL}`}>{CONTACT_EMAIL}<span aria-hidden="true">↗</span></a>
        <button className="copy-email" type="button" onClick={copy} disabled={copyState === 'pending'} aria-describedby="copy-feedback"><span>{copyState === 'copied' ? '已复制' : copyState === 'pending' ? '正在复制…' : '复制邮箱'}</span><span aria-hidden="true">{copyState === 'copied' ? '✓' : '⧉'}</span></button>
      </div>
      <p id="copy-feedback" className="copy-feedback" role="status" aria-live="polite" aria-atomic="true">{copyState === 'copied' ? '邮箱已复制，可以粘贴到你的邮件应用。' : copyState === 'manual' ? '浏览器未允许自动复制。请复制下方已选中的邮箱，或点击邮箱发送邮件。' : '\u00a0'}</p>
      {copyState === 'manual' && <label className="manual-copy">邮箱地址<input ref={input} readOnly value={CONTACT_EMAIL} onFocus={event => event.target.select()} /></label>}
      <div className="finale-bottom"><span className="finale-signature">Arthur / 宋文清</span><a href="tel:+8618256109164"><small>PHONE</small> +86 182 5610 9164</a><span><small>QQ</small> 1784870640</span></div>
      <footer><span>2026 © Arthur</span><span>China · UTC+8</span><button type="button" onClick={toggleMotion} aria-pressed={disabled} disabled={reduced}>{reduced ? '系统减少动效' : disabled ? '开启动效　▷' : '暂停动效　Ⅱ'}</button><a className="back-top" href="#top">Back to top <span aria-hidden="true">↑</span></a></footer>
    </div>
  </section>;
}
