import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { gsap } from 'gsap';
import { canReturnToFilm, LandingGuard, nextPortalPhase, WheelIntent, type PortalDestination, type PortalPhase } from './portal-policy';

export function useFilmPortal(
  stageRef: RefObject<HTMLElement>,
  heroRef: RefObject<HTMLDivElement>,
  reduced: boolean,
) {
  const [phase, setPhase] = useState<PortalPhase>('film');
  const phaseRef = useRef<PortalPhase>('film');
  const requestRef = useRef<(destination: PortalDestination) => void>(() => {});

  useLayoutEffect(() => {
    const stage = stageRef.current, hero = heroRef.current;
    if (!stage || !hero) return;
    const html = document.documentElement;
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    let timeline: gsap.core.Timeline | undefined;
    let lastWheel = -Infinity, wheelStartedAtTop = true;
    let touchY = 0, touchX = 0, touchStartedAtTop = false, touchControl = false;
    let touchConsumed = false, transitionKey = '';
    const guard = new LandingGuard();
    const wheelIntent = new WheelIntent();
    const updatePhase = (next: PortalPhase) => { phaseRef.current = next; setPhase(next); };
    const controlTarget = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('.film-controls, .film-review'));
    const lock = () => html.classList.add('film-portal-locked');
    const alignTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const settle = (destination: PortalDestination, focus = true) => {
      timeline?.kill(); timeline = undefined;
      alignTop();
      gsap.set([stage, hero], { clearProps: 'transform,willChange' });
      gsap.set(stage, { opacity: destination === 'film' ? 1 : 0 });
      gsap.set(hero, { opacity: destination === 'hero' ? 1 : 0 });
      // Move focus before making the outgoing scene inaccessible.
      if (destination === 'hero') {
        hero.inert = false;
        hero.removeAttribute('aria-hidden');
        if (focus) hero.focus({ preventScroll: true });
        stage.inert = true;
        stage.setAttribute('aria-hidden', 'true');
        html.classList.remove('film-portal-locked');
      } else {
        stage.inert = false;
        stage.removeAttribute('aria-hidden');
        if (focus) stage.querySelector<HTMLButtonElement>('.film-enter')?.focus({ preventScroll: true });
        hero.inert = true;
        hero.setAttribute('aria-hidden', 'true');
        lock();
      }
      updatePhase(destination);
      guard.land(performance.now());
    };

    const travel = (destination: PortalDestination) => {
      const next = nextPortalPhase(phaseRef.current, destination);
      if (next === phaseRef.current) return;
      guard.start(performance.now());
      lock(); alignTop();
      hero.inert = true; stage.inert = true;
      updatePhase(next);
      if (reduced) { settle(destination); return; }
      gsap.set([stage, hero], { willChange: 'transform, opacity' });
      // A complete timed handoff, not scroll-scrub: no half-screen resting state.
      timeline = gsap.timeline({ onComplete: () => settle(destination) });
      if (destination === 'hero') {
        timeline.fromTo(stage, { opacity: 1, scale: 1 }, { opacity: 0, scale: 1.035, duration: .72, ease: 'power2.inOut' }, 0);
        timeline.fromTo(hero, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: .78, ease: 'power3.out' }, .08);
      } else {
        timeline.fromTo(hero, { opacity: 1, y: 0 }, { opacity: 0, y: 24, duration: .58, ease: 'power2.inOut' }, 0);
        timeline.fromTo(stage, { opacity: 0, scale: 1.035 }, { opacity: 1, scale: 1, duration: .78, ease: 'power3.out' }, .04);
      }
    };
    requestRef.current = travel;

    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const now = performance.now(), top = window.scrollY <= 1;
      if (now - lastWheel > 200) { wheelStartedAtTop = top; wheelIntent.reset(); }
      lastWheel = now;
      const current = phaseRef.current;
      if (guard.consume(now) || current === 'entering' || current === 'returning') { event.preventDefault(); return; }
      const intent = wheelIntent.add(event.deltaY, event.deltaMode, window.innerHeight);
      if (current === 'film') {
        event.preventDefault();
        if (intent > 0) travel('hero');
      } else if (top && event.deltaY < 0) {
        event.preventDefault();
        if (canReturnToFilm(window.scrollY, wheelStartedAtTop, intent)) travel('film');
      }
    };

    const touchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchY = event.touches[0].clientY; touchX = event.touches[0].clientX;
      touchStartedAtTop = window.scrollY <= 1;
      touchControl = controlTarget(event.target);
      touchConsumed = false;
    };
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const current = phaseRef.current;
      if (touchConsumed || current === 'entering' || current === 'returning') { event.preventDefault(); return; }
      if (touchControl) return;
      const dy = event.touches[0].clientY - touchY, dx = event.touches[0].clientX - touchX;
      if (Math.abs(dx) > Math.abs(dy)) return;
      if (current === 'film') {
        event.preventDefault();
        if (dy < -30) { touchConsumed = true; travel('hero'); }
      } else if (touchStartedAtTop && window.scrollY <= 1 && dy > 0) {
        event.preventDefault();
        if (dy > 40) { touchConsumed = true; travel('film'); }
      }
    };
    const touchEnd = () => { touchConsumed = false; };

    const keyDown = (event: KeyboardEvent) => {
      if (transitionKey === event.key) { event.preventDefault(); return; }
      if (event.ctrlKey || event.metaKey || event.altKey || controlTarget(event.target)) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || target.matches('input,textarea,select')) return;
      const current = phaseRef.current;
      if (['entering', 'returning'].includes(current) && [' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Escape'].includes(event.key)) { event.preventDefault(); return; }
      if (current === 'film' && [' ', 'ArrowDown', 'PageDown', 'End', 'Escape'].includes(event.key)) {
        event.preventDefault(); transitionKey = event.key; travel('hero');
      } else if (current === 'hero' && window.scrollY <= 1 && ['ArrowUp', 'PageUp', 'Home'].includes(event.key)) {
        event.preventDefault(); transitionKey = event.key; travel('film');
      }
    };
    const keyUp = (event: KeyboardEvent) => { if (event.key === transitionKey) transitionKey = ''; };
    const blur = () => { transitionKey = ''; touchConsumed = false; };
    const resize = () => {
      // Rotation/window resize must not leave an interpolated scene or stale offset.
      if (phaseRef.current === 'entering') settle('hero');
      else if (phaseRef.current === 'returning') settle('film');
    };
    const restore = () => settle('film', false);
    if (phaseRef.current === 'hero' || phaseRef.current === 'entering') settle('hero', false);
    else settle('film', false);
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', touchEnd);
    window.addEventListener('touchcancel', touchEnd);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);
    window.addEventListener('resize', resize);
    window.addEventListener('pageshow', restore);
    return () => {
      timeline?.kill();
      gsap.set([stage, hero], { clearProps: 'transform,opacity,willChange' });
      hero.inert = false; stage.inert = false;
      hero.removeAttribute('aria-hidden'); stage.removeAttribute('aria-hidden');
      html.classList.remove('film-portal-locked');
      history.scrollRestoration = previousRestoration;
      window.removeEventListener('wheel', wheel); window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchmove', touchMove); window.removeEventListener('keydown', keyDown);
      window.removeEventListener('touchend', touchEnd); window.removeEventListener('touchcancel', touchEnd);
      window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', blur);
      window.removeEventListener('resize', resize); window.removeEventListener('pageshow', restore);
    };
  }, [heroRef, stageRef, reduced]);

  return { phase, enterHero: () => requestRef.current('hero'), returnToFilm: () => requestRef.current('film') };
}
