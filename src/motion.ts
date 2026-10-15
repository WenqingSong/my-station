import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fragmentId, navigationDuration, navigationOffset } from './navigation';
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

// Sticky rectangles describe the currently pinned position, not the anchor's
// original place in the document. Resolve scenes from their flow siblings.
function anchorTop(target: HTMLElement) {
  if (target.matches('.work-scene') && target.parentElement && getComputedStyle(target).position === 'sticky') {
    let top = scrollY + target.parentElement.getBoundingClientRect().top;
    for (const sibling of Array.from(target.parentElement.children)) {
      if (sibling === target) break;
      top += (sibling as HTMLElement).offsetHeight + parseFloat(getComputedStyle(sibling).marginBottom || '0');
    }
    return top;
  }
  return scrollY + target.getBoundingClientRect().top;
}

export function useMotionInfrastructure({ disabled, compact }: MotionInfrastructureOptions) {
  const destination = useRef<HTMLElement | null>(null);
  const initialNavigation = useRef(true);
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
      stopInertiaOnNavigate: false
    });
    const update = (time: number) => lenis?.raf(time * 1000);
    const unsubscribe = lenis?.on('scroll', ScrollTrigger.update);
    let locked = false;
    let openingWasLocked = document.documentElement.classList.contains('intro-locked');
    let restoreFrame = 0;
    let endTimer = 0;
    let alive = true;
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const targetTop = (target: HTMLElement) => Math.max(0, anchorTop(target) - (target.id === 'top' ? 0 : navigationOffset(document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0, innerHeight)));
    const clearDestination = () => { destination.current = null; clearTimeout(endTimer); };
    const cancelScroll = () => {
      // scrollTo(current, immediate) can early-return when Lenis already has
      // that target, leaving the previous animation running. Stop it explicitly.
      if (lenis) { lenis.stop(); if (!locked) lenis.start(); }
      else window.scrollTo({ top: scrollY, behavior: 'instant' });
    };
    const stopNavigation = () => {
      initialNavigation.current = false;
      if (!destination.current) return;
      clearDestination();
      cancelScroll();
    };
    const travel = (target: HTMLElement, immediate = false) => {
      clearTimeout(endTimer);
      cancelScroll();
      destination.current = target;
      const top = targetTop(target);
      if (lenis) lenis.scrollTo(top, { immediate, duration: navigationDuration(top - scrollY, innerHeight), easing: t => 1 - Math.pow(1 - t, 4), onComplete: clearDestination });
      else {
        window.scrollTo({ top, behavior: immediate || disabled ? 'instant' : 'smooth' });
        if (immediate || disabled) clearDestination();
        else endTimer = window.setTimeout(clearDestination, 1400);
      }
    };
    const restoreHash = () => {
      if (!alive || document.documentElement.classList.contains('intro-locked')) return;
      const target = document.getElementById(fragmentId(location.hash) || 'top');
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        travel(target, true);
      }
      initialNavigation.current = false;
    };
    const resize = () => {
      cancelAnimationFrame(restoreFrame);
      restoreFrame = requestAnimationFrame(() => {
        lenis?.resize();
        // Only a navigation in flight is retargeted. Resizing while reading
        // must not drag the visitor back to an old hash.
        if (destination.current) travel(destination.current, true);
      });
    };
    const syncLock = () => {
      const openingLocked = document.documentElement.classList.contains('intro-locked');
      if (openingWasLocked && !openingLocked && location.hash) {
        cancelAnimationFrame(restoreFrame);
        restoreFrame = requestAnimationFrame(() => { ScrollTrigger.refresh(); restoreHash(); });
      }
      openingWasLocked = openingLocked;
      const next = document.hidden || openingLocked || document.documentElement.classList.contains('jobs-modal-open');
      if (next === locked) return;
      locked = next;
      if (locked) { stopNavigation(); lenis?.stop(); } else lenis?.start();
    };
    const lockObserver = new MutationObserver(syncLock);
    lockObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', syncLock);
    syncLock();

    // Native links stay functional without JS; enhanced navigation respects motion preferences.
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (!hash || hash === '#' || link?.target === '_blank' || link?.hasAttribute('download')) return;
      const target = document.getElementById(fragmentId(hash));
      if (!target) return;
      event.preventDefault();
      stopNavigation();
      if (location.hash !== hash) history.pushState(null, '', hash);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      travel(target);
    };
    document.addEventListener('click', navigate);
    const revealFocusedScene = (event: FocusEvent) => {
      const control = event.target as HTMLElement;
      const scene = control.closest<HTMLElement>('.work-scene');
      if (!scene || control === scene || compact || disabled || getComputedStyle(scene).position !== 'sticky') return;
      const rect = control.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2)));
      if (rect.top >= 76 && rect.bottom <= innerHeight && hit && scene.contains(hit)) return;
      const inside = rect.bottom - scene.getBoundingClientRect().top;
      const top = Math.max(0, anchorTop(scene) + Math.max(-76, inside - innerHeight + 32));
      if (lenis) lenis.scrollTo(top, { immediate: true });
      else window.scrollTo({ top, behavior: 'instant' });
    };
    document.addEventListener('focusin', revealFocusedScene);
    const interruptKey = (event: KeyboardEvent) => {
      if ((event.target as Element)?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape', 'Tab'].includes(event.key)) stopNavigation();
    };
    // Capture before Lenis so the next wheel delta starts at the visible
    // position rather than the previous, far-away programmatic destination.
    addEventListener('wheel', stopNavigation, { passive: true, capture: true });
    addEventListener('touchstart', stopNavigation, { passive: true, capture: true });
    addEventListener('keydown', interruptKey, true);
    addEventListener('blur', stopNavigation);
    addEventListener('resize', resize);
    if (destination.current) resize();
    addEventListener('popstate', restoreHash);
    addEventListener('hashchange', restoreHash);
    const restoreInitial = () => { if (initialNavigation.current && location.hash && scrollY < 1) restoreHash(); };
    const hashDeadline = window.setTimeout(restoreInitial, 700);
    document.fonts.ready.then(restoreInitial);

    if (lenis) gsap.ticker.add(update);
    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener('click', navigate);
      document.removeEventListener('focusin', revealFocusedScene);
      alive = false;
      cancelAnimationFrame(restoreFrame);
      clearTimeout(endTimer);
      removeEventListener('wheel', stopNavigation, true);
      removeEventListener('touchstart', stopNavigation, true);
      removeEventListener('keydown', interruptKey, true);
      removeEventListener('blur', stopNavigation);
      removeEventListener('resize', resize);
      clearTimeout(hashDeadline);
      removeEventListener('popstate', restoreHash);
      removeEventListener('hashchange', restoreHash);
      lockObserver.disconnect();
      history.scrollRestoration = previousRestoration;
      document.removeEventListener('visibilitychange', syncLock);
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
      if (revealTargets.length) gsap.set(revealTargets, { clearProps: 'all' });
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

    let active = true;
    const refresh = () => { if (active) ScrollTrigger.refresh(); };
    document.fonts.ready.then(refresh);
    addEventListener('load', refresh, { once: true });

    return () => {
      active = false;
      removeEventListener('load', refresh);
      context.revert();
      if (revealTargets.length) gsap.set(revealTargets, { clearProps: 'all' });
      sections.forEach(section => { delete section.dataset.motionState; });
    };
  }, [compact, disabled]);
}
