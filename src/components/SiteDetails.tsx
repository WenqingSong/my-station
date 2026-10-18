import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const chapters = [
  ['top', '01', 'Home'], ['work', '02', 'Selected work'],
  ['skills', '03', 'Foundation'], ['about', '04', 'About Arthur'], ['contact', '05', 'Contact']
];

export default function SiteDetails({ disabled, compact }: { disabled: boolean; compact: boolean }) {
  const progressRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(chapters[0]);

  useEffect(() => {
    let frame = 0;
    let lastPercent = -1;
    const header = document.querySelector('.site-header');
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      const percent = Math.round(progress * 100);
      if (progressRef.current) {
        progressRef.current.style.setProperty('--read-progress', `${progress}`);
        if (percent !== lastPercent) progressRef.current.setAttribute('aria-valuenow', `${percent}`);
      }
      lastPercent = percent;
      header?.classList.toggle('is-scrolled', scrollY > 70);
      let current = chapters[0];
      for (const item of chapters) {
        if ((document.getElementById(item[0])?.getBoundingClientRect().top ?? Infinity) <= innerHeight * .38) current = item;
      }
      if (progress > .995) current = chapters[chapters.length - 1];
      setChapter(previous => previous === current ? previous : current);
      document.querySelectorAll('.site-header nav a').forEach(link => {
        const active = link.getAttribute('href') === `#${current[0]}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, []);

  useEffect(() => {
    if (disabled || compact || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const cursor = cursorRef.current;
    let frame = 0;
    let point = { x: 0, y: 0 };
    let magnet: HTMLElement | null = null;
    let title: HTMLElement | null = null;
    const resetMagnet = () => {
      magnet?.style.removeProperty('--magnet-x'); magnet?.style.removeProperty('--magnet-y'); magnet = null;
    };
    const resetTitle = () => {
      title?.style.removeProperty('--follow-x'); title?.style.removeProperty('--follow-y'); title = null;
    };
    const hide = () => {
      cancelAnimationFrame(frame); frame = 0;
      resetMagnet(); resetTitle(); cursor?.classList.remove('is-visible');
    };
    const render = () => {
      frame = 0;
      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        const x = Math.max(-9, Math.min(9, (point.x - rect.left - rect.width / 2) * .13));
        const y = Math.max(-9, Math.min(9, (point.y - rect.top - rect.height / 2) * .13));
        magnet.style.setProperty('--magnet-x', `${x}px`); magnet.style.setProperty('--magnet-y', `${y}px`);
      }
      if (title) {
        const rect = title.getBoundingClientRect();
        title.style.setProperty('--follow-x', `${Math.max(-9, Math.min(9, (point.x - rect.left - rect.width / 2) * .035))}px`);
        title.style.setProperty('--follow-y', `${Math.max(-4, Math.min(4, (point.y - rect.top - rect.height / 2) * .035))}px`);
      }
      if (cursor) cursor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || document.documentElement.classList.contains('intro-locked')) return;
      const target = event.target as Element;
      const nextMagnet = target.closest<HTMLElement>('[data-magnetic]');
      const nextTitle = target.closest<HTMLElement>('.scene-title-follow');
      if (magnet !== nextMagnet) { resetMagnet(); magnet = nextMagnet; }
      if (title !== nextTitle) { resetTitle(); title = nextTitle; }
      const contextual = !!target.closest('[data-cursor="action"]');
      cursor?.classList.toggle('is-visible', contextual);
      point = { x: event.clientX, y: event.clientY };
      if (!frame && (magnet || title || contextual)) frame = requestAnimationFrame(render);
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', hide);
    addEventListener('blur', hide);
    addEventListener('scroll', hide, { passive: true });
    return () => { hide(); document.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', hide); removeEventListener('blur', hide); removeEventListener('scroll', hide); };
  }, [compact, disabled]);

  useLayoutEffect(() => {
    if (disabled) return;
    const context = gsap.context(() => {
      gsap.fromTo('.contact-rule-line', { scaleX: .12 }, { scaleX: 1, duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: '.contact-rule', start: 'top 90%', once: true } });
      gsap.fromTo('.contact-signoff-word', { yPercent: 108 }, { yPercent: 0, duration: 1.15, ease: 'power4.out', scrollTrigger: { trigger: '.contact-signoff', start: 'top 96%', once: true } });
      if (!compact) gsap.fromTo('.contact-arrival-mark', { rotate: -65 }, { rotate: 0, ease: 'none', scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top 15%', scrub: .8 } });
    });
    return () => context.revert();
  }, [disabled, compact]);

  return <>
    <div className="reading-progress" role="progressbar" aria-label="页面阅读进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} ref={progressRef}><span /></div>
    <div className="chapter-indicator" aria-label={`当前章节：${chapter[2]}`}><span>{chapter[1]}</span><span className="chapter-divider" /><span>{chapter[2]}</span></div>
    <div className="context-cursor" ref={cursorRef} aria-hidden="true"><span /></div>
  </>;
}
