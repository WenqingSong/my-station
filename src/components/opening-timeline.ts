import { gsap } from 'gsap';
import type { OPENING_MOTION, openingSchedule } from './opening-sequence';

type Options = {
  masks: HTMLElement[];
  glyphs: SVGElement[][];
  widths: number[];
  dot: SVGCircleElement;
  panel: HTMLElement;
  skip: HTMLElement;
  motion: typeof OPENING_MOTION;
  schedule: ReturnType<typeof openingSchedule>;
  onPhase: (phase: string, index: number) => void;
  onComplete: () => void;
};

// No global selectors or Hero targets. A paused timeline is fully constructed
// before the caller owns it, and can also be deterministically checked in Node.
export function createOpeningTimeline({ masks, glyphs, widths, dot, panel, skip, motion, schedule, onPhase, onComplete }: Options) {
  const sequence = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete });
  sequence.set(dot, { x: -widths[0] / 2 - 30, y: 0, opacity: 0 })
    .to(dot, { opacity: 1, duration: .24 }, 0);
  schedule.words.forEach((word, index) => {
    const last = index === schedule.words.length - 1;
    sequence
      .call(() => onPhase('enter', index), [], word.enterAt)
      .set(masks[index], { visibility: 'visible' }, word.enterAt)
      .fromTo(glyphs[index], { y: 150 },
        { y: 0, duration: motion.enter, stagger: motion.enterStagger, ease: 'power3.out' }, word.enterAt)
      .call(() => onPhase('hold', index), [], word.holdAt)
      .call(() => onPhase('leave', index), [], word.leaveAt)
      .to(glyphs[index], { y: -150, duration: motion.exit, stagger: motion.exitStagger, ease: 'power2.in' }, word.leaveAt)
      .set(masks[index], { visibility: 'hidden' }, word.hiddenAt);

    if (last) {
      // Travel underneath the arriving Hello, then settle as its punctuation.
      sequence.to(dot, { y: 80, duration: .14, ease: 'power2.in' }, word.enterAt)
        .to(dot, { x: widths[index] / 2 + 24, duration: .26, ease: 'power2.inOut' }, word.enterAt + .10)
        .to(dot, { y: 30, duration: .18, ease: 'power3.out' }, word.enterAt + .34);
    } else {
      sequence.to(dot, { x: -widths[index] / 2 - 30, duration: .34, ease: 'power3.inOut' }, word.enterAt);
    }
  });
  return sequence
    .call(() => onPhase('curtain', schedule.words.length - 1), [], schedule.curtainAt)
    .to(dot, { y: -32, opacity: 0, duration: .28, ease: 'power2.in' }, schedule.curtainAt)
    .to(panel, { yPercent: -101, duration: motion.curtain, ease: 'expo.inOut' }, schedule.curtainAt)
    .to(skip, { opacity: 0, duration: .18 }, schedule.curtainAt);
}
