import { useLayoutEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { anchorTop, navigationInset } from './navigation';
import { captureReadingPoint, restoreReadingPoint, type ReadingPoint } from './reading-position';

// Preserve the current chapter, not an obsolete absolute scroll offset, when
// responsive layouts or the explicit motion preference change scene heights.
export function useReadingPosition(compact: boolean, disabled: boolean) {
  const point = useRef<ReadingPoint | null>(null);
  const restoreRef = useRef(() => {});
  useLayoutEffect(() => {
    let frame = 0, settleFrame = 0, resizing = false;
    let width = innerWidth;
    const locked = () => document.documentElement.classList.contains('intro-locked');
    const regions = () => [...document.querySelectorAll<HTMLElement>('main > section[id], .work-scene[id]')]
      .map(element => ({ id: element.id, top: anchorTop(element), height: element.id === 'work'
        ? (element.querySelector<HTMLElement>('.work-prologue')?.offsetHeight ?? element.offsetHeight)
        : element.offsetHeight }));
    const capture = () => {
      if (!resizing && !locked()) point.current = captureReadingPoint(regions(), scrollY + navigationInset());
    };
    const restore = () => {
      if (locked() || !point.current) return;
      resizing = true;
      cancelAnimationFrame(frame); cancelAnimationFrame(settleFrame);
      // Let scene measurements and their ScrollTriggers rebuild first.
      frame = requestAnimationFrame(() => {
        settleFrame = requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          const top = point.current && restoreReadingPoint(point.current, regions(), navigationInset());
          if (top !== null && !locked()) {
            window.scrollTo({ top, behavior: 'instant' });
            window.dispatchEvent(new CustomEvent('site:scroll-restore', { detail: { top } }));
            ScrollTrigger.update();
          }
          resizing = false;
          capture();
        });
      });
    };
    restoreRef.current = restore;
    const resize = () => {
      if (innerWidth === width) return; // Mobile browser chrome is not a layout change.
      width = innerWidth;
      restore();
    };
    const interrupt = () => {
      cancelAnimationFrame(frame); cancelAnimationFrame(settleFrame);
      resizing = false; capture();
    };
    const onScroll = () => {
      if (resizing || width !== innerWidth) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(capture);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', resize);
    addEventListener('wheel', interrupt, { passive: true });
    addEventListener('touchstart', interrupt, { passive: true });
    addEventListener('keydown', interrupt);
    capture();
    return () => {
      cancelAnimationFrame(frame); cancelAnimationFrame(settleFrame);
      removeEventListener('scroll', onScroll); removeEventListener('resize', resize);
      removeEventListener('wheel', interrupt); removeEventListener('touchstart', interrupt);
      removeEventListener('keydown', interrupt);
    };
  }, []);
  useLayoutEffect(() => { restoreRef.current(); }, [compact, disabled]);
}
