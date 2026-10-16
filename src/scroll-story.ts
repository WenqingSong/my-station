import { gsap } from 'gsap';

// Scroll is the clock: each beat is seekable in either direction. No timers,
// once-only entrances or opacity gates on descriptions, evidence and links.
export function storyBeats(compact: boolean) {
  return {
    title: { from: { yPercent: 105 }, to: { yPercent: 0 } },
    crop: {
      from: { clipPath: compact ? 'inset(6% 4% 6% 4%)' : 'inset(12% 9% 10% 9%)' },
      to: { clipPath: 'inset(0% 0% 0% 0%)' }
    },
    artwork: { from: { yPercent: compact ? 3 : 7, scale: compact ? 1.02 : 1.06 }, to: { yPercent: compact ? -2 : -4, scale: 1 } },
    handoff: { from: { y: 0, scale: 1 }, to: { y: -32, scale: .955 } },
    portrait: { from: { clipPath: compact ? 'inset(0% 0% 45% 0%)' : 'inset(0% 0% 85% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' } },
    chapter: { from: { y: compact ? 16 : 36 }, to: { y: 0 } },
    closing: { from: { yPercent: compact ? 28 : 60 }, to: { yPercent: 0 } }
  };
}

export function createStoryTween(target: gsap.TweenTarget, beat: keyof ReturnType<typeof storyBeats>, compact: boolean, scrollTrigger?: gsap.TweenVars['scrollTrigger']) {
  const frames = storyBeats(compact)[beat];
  return gsap.fromTo(target, frames.from, {
    ...frames.to, duration: 1, ease: 'none', paused: !scrollTrigger,
    ...(scrollTrigger ? { scrollTrigger } : {})
  });
}

// Read layout coordinates, never transformed/sticky screen coordinates.
export function offsetWithin(element: HTMLElement, ancestor: HTMLElement) {
  let top = 0;
  let current: HTMLElement | null = element;
  while (current && current !== ancestor) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

export function stickySceneTop(viewportHeight: number, sceneHeight: number) {
  // A tall scene must scroll completely into view before it holds.
  return Math.min(0, viewportHeight - sceneHeight);
}
