import { useEffect, useLayoutEffect, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const MOTION = {
  duration: {
    fast: 0.28,
    standard: 0.78,
    slow: 1.08
  },
  ease: {
    standard: 'power3.out',
    reveal: 'power4.out',
    inOut: 'power4.inOut'
  }
} as const;

export function useCompactMotion() {
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 767px), (pointer: coarse)').matches);

  useEffect(() => {
    const query = matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return compact;
}

type MotionInfrastructureOptions = {
  disabled: boolean;
  compact: boolean;
};

export function useMotionInfrastructure({ disabled, compact }: MotionInfrastructureOptions) {
  useEffect(() => {
    gsap.defaults({ duration: MOTION.duration.standard, ease: MOTION.ease.standard });
    ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });
    gsap.ticker.lagSmoothing(0);
  }, []);

  useEffect(() => {
    const lenis = disabled || compact ? null : new Lenis({
      autoRaf: false,
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.86,
      anchors: false,
      stopInertiaOnNavigate: true
    });
    const update = (time: number) => lenis?.raf(time * 1000);
    const unsubscribe = lenis?.on('scroll', ScrollTrigger.update);

    // Native links stay functional without JS; enhanced navigation respects motion preferences.
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      if (location.hash !== hash) history.pushState(null, '', hash);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      const offset = hash === '#top' ? 0 : -76;
      if (lenis) lenis.scrollTo(target, { offset, duration: hash === '#top' ? 1.65 : 1.2, easing: t => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: Math.max(0, scrollY + target.getBoundingClientRect().top + offset), behavior: disabled ? 'instant' : 'smooth' });
    };
    document.addEventListener('click', navigate);

    if (lenis) gsap.ticker.add(update);
    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener('click', navigate);
      unsubscribe?.();
      gsap.ticker.remove(update);
      lenis?.destroy();
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
    };
  }, [compact, disabled]);

  useLayoutEffect(() => {
    const root = document.querySelector('main');
    if (!root) return;

    const revealTargets = root.querySelectorAll<HTMLElement>(
      '[data-reveal="text"] .reveal-line-inner, [data-reveal="content"], [data-reveal="row"], [data-reveal="image"]'
    );
    const sections = root.querySelectorAll<HTMLElement>('[data-motion-section]');

    if (disabled) {
      gsap.set(revealTargets, { clearProps: 'all' });
      sections.forEach(section => { section.dataset.motionState = 'visible'; });
      ScrollTrigger.refresh();
      return;
    }

    const context = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-reveal="text"]').forEach(block => {
        const lines = block.querySelectorAll<HTMLElement>('.reveal-line-inner');
        gsap.fromTo(lines,
          { yPercent: 112, rotate: compact ? 0 : 1.2, scaleY: compact ? 1 : 1.06, transformOrigin: '50% 100%' },
          {
            yPercent: 0,
            rotate: 0,
            scaleY: 1,
            duration: compact ? 0.62 : MOTION.duration.slow,
            stagger: compact ? 0.055 : 0.1,
            ease: MOTION.ease.reveal,
            scrollTrigger: { trigger: block, start: compact ? 'top 92%' : 'top 84%', once: true }
          }
        );
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="content"]').forEach(element => {
        gsap.fromTo(element,
          { y: compact ? 22 : 46, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: compact ? 0.6 : MOTION.duration.standard,
            ease: MOTION.ease.standard,
            scrollTrigger: { trigger: element, start: compact ? 'top 94%' : 'top 88%', once: true }
          }
        );
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="row"]').forEach((element, index) => {
        gsap.fromTo(element,
          { y: compact ? 18 : 34, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: compact ? 0.52 : 0.72,
            delay: compact ? 0 : Math.min(index % 3, 2) * 0.045,
            ease: MOTION.ease.standard,
            scrollTrigger: { trigger: element, start: 'top 93%', once: true }
          }
        );
      });

      root.querySelectorAll<HTMLElement>('[data-reveal="image"]').forEach(element => {
        const image = element.querySelector<HTMLElement>('img');
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: element, start: compact ? 'top 94%' : 'top 86%', once: true }
        });
        timeline
          .fromTo(element,
            { clipPath: 'inset(0 0 100% 0)' },
            { clipPath: 'inset(0 0 0% 0)', duration: compact ? 0.7 : 1.08, ease: MOTION.ease.inOut })
          .fromTo(image,
            { scale: compact ? 1.025 : 1.08 },
            { scale: 1, duration: compact ? 0.72 : 1.18, ease: MOTION.ease.reveal },
            '<');
      });

      sections.forEach(section => {
        section.dataset.motionState = 'before';
        ScrollTrigger.create({
          trigger: section,
          start: 'top 76%',
          end: 'bottom 24%',
          onEnter: () => { section.dataset.motionState = 'active'; },
          onEnterBack: () => { section.dataset.motionState = 'active'; },
          onLeave: () => { section.dataset.motionState = 'after'; },
          onLeaveBack: () => { section.dataset.motionState = 'before'; }
        });
      });
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    addEventListener('load', refresh, { once: true });

    return () => {
      removeEventListener('load', refresh);
      context.revert();
      gsap.set(revealTargets, { clearProps: 'all' });
      sections.forEach(section => { delete section.dataset.motionState; });
    };
  }, [compact, disabled]);
}
