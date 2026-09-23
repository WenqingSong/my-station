/*
 * Adapted from React Bits AnimatedContent.
 * Copyright (c) 2026 David Haz — MIT + Commons Clause.
 */
import { PropsWithChildren, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION } from '../motion';

gsap.registerPlugin(ScrollTrigger);

type Props = PropsWithChildren<{
  className?: string;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  delay?: number;
  threshold?: number;
  disabled?: boolean;
}>;

export default function AnimatedContent({
  children,
  className = '',
  distance = 72,
  direction = 'vertical',
  reverse = false,
  duration = MOTION.duration.standard,
  delay = 0,
  threshold = 0.18,
  disabled = false
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (disabled) {
      gsap.set(el, { clearProps: 'all', visibility: 'visible' });
      return;
    }
    const axis = direction === 'horizontal' ? 'x' : 'y';
    const offset = reverse ? -distance : distance;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { [axis]: offset, opacity: 0, visibility: 'visible' },
        {
          [axis]: 0,
          opacity: 1,
          duration,
          delay,
          ease: MOTION.ease.standard,
          scrollTrigger: {
            trigger: el,
            start: `top ${(1 - threshold) * 100}%`,
            once: true
          }
        }
      );
    }, el);
    return () => ctx.revert();
  }, [delay, direction, disabled, distance, duration, reverse, threshold]);

  return <div ref={ref} className={className} style={{ visibility: disabled ? 'visible' : 'hidden' }}>{children}</div>;
}
