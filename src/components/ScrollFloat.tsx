/*
 * Adapted from React Bits ScrollFloat.
 * Copyright (c) 2026 David Haz — MIT + Commons Clause.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION } from '../motion';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: string;
  className?: string;
  disabled?: boolean;
};

export default function ScrollFloat({ children, className = '', disabled = false }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const characters = useMemo(() => children.split('').map((char, index) => (
    <span className="scroll-char" key={index}>{char === ' ' ? '\u00a0' : char}</span>
  )), [children]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = el.querySelectorAll('.scroll-char');
    if (disabled) {
      gsap.set(chars, { clearProps: 'all' });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(chars,
        { opacity: 0, yPercent: 115, scaleY: 1.7, scaleX: 0.82, transformOrigin: '50% 0%' },
        {
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          scaleX: 1,
          stagger: 0.025,
          ease: MOTION.ease.inOut,
          scrollTrigger: {
            trigger: el,
            start: 'top bottom-=7%',
            end: 'bottom center+=12%',
            scrub: 0.75
          }
        }
      );
    }, el);
    return () => ctx.revert();
  }, [children, disabled]);

  return <h2 ref={ref} className={`scroll-float ${className}`}><span>{characters}</span></h2>;
}
