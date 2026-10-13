import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import type { gsap } from 'gsap';
import { useModalFocus } from '../useModalFocus';
import { GREETINGS, OPENING_MOTION, openingSchedule } from './opening-sequence';
import { createOpeningTimeline } from './opening-timeline';
import './opening.css';

type Props = { reduced: boolean; onComplete?: () => void };

export default function Opening({ reduced, onComplete }: Props) {
  // Play on every document load, including refreshes at a section anchor.
  // Reduced motion remains an explicit accessibility exception.
  const [visible, setVisible] = useState(() => !reduced);
  const maskId = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const completed = useRef(false);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    timeline.current?.kill();
    timeline.current = null;
    document.documentElement.classList.remove('intro-locked');
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  useModalFocus(rootRef, visible && !reduced, finish);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!visible || reduced || !root) { finish(); return; }
    let cancelled = false;
    let fontDeadline = 0;
    document.documentElement.classList.add('intro-locked');

    const start = async () => {
      // Opening-specific subsets avoid waiting for every font/image on the page.
      // Decide once: a late custom font must never replace a visible system glyph.
      let ready: Promise<boolean>;
      try {
        ready = Promise.all([
          document.fonts.load('500 100px OpeningLatin', GREETINGS.filter(word => word.script === 'latin').map(word => word.text).join('')),
          document.fonts.load('500 100px OpeningCJK', GREETINGS.filter(word => word.script === 'cjk').map(word => word.text).join(''))
        ]).then(faces => faces.every(group => group.length > 0 && group.every(face => face.status === 'loaded')), () => false);
      } catch { ready = Promise.resolve(false); }
      const loaded = await Promise.race([
        ready,
        new Promise<boolean>(resolve => { fontDeadline = window.setTimeout(() => resolve(false), OPENING_MOTION.fontDeadlineMs); })
      ]);
      clearTimeout(fontDeadline);
      if (cancelled || completed.current) return;
      root.dataset.font = loaded ? 'custom' : 'system';

      const masks = Array.from(root.querySelectorAll<HTMLElement>('.opening-greeting'));
      const context = document.createElement('canvas').getContext('2d');
      // Measure real glyphs, then place each letter on one common baseline.
      // No horizontal scaling, animated tracking, or synthetic font blur.
      const widths = masks.map((mask, index) => {
        const text = GREETINGS[index].text;
        const letters = Array.from(mask.querySelectorAll<SVGTextElement>('.opening-word'));
        if (!context || !letters.length) return 0;
        const family = getComputedStyle(letters[0]).fontFamily;
        context.font = '500 100px ' + family;
        const ascent = context.measureText(text).actualBoundingBoxAscent || 80;
        let size = Math.min(150, Math.max(70, 8000 / ascent));
        context.font = `500 ${size}px ${family}`;
        const measured = context.measureText(text).width;
        // Leave a real gutter for the moving dot, including fallback fonts.
        if (measured > 620) { size *= 620 / measured; context.font = `500 ${size}px ${family}`; }
        const width = context.measureText(text).width;
        let prefix = '';
        letters.forEach(letter => {
          // The difference accounts for pair kerning at the current boundary.
          const value = letter.textContent || '';
          const offset = context.measureText(prefix + value).width - context.measureText(value).width;
          letter.setAttribute('font-size', String(size));
          letter.setAttribute('x', String(400 - width / 2 + offset));
          prefix += value;
        });
        return width;
      });

      // If text measurement is unavailable, entering the site is more useful
      // than rendering overlapped letters or leaving a blocked black screen.
      if (widths.some(width => !Number.isFinite(width) || width <= 0)) { finish(); return; }

      timeline.current = createOpeningTimeline({
        masks,
        glyphs: masks.map(mask => Array.from(mask.querySelectorAll<SVGElement>('.opening-glyph'))),
        widths,
        dot: root.querySelector<SVGCircleElement>('.opening-dot')!,
        panel: root.querySelector<HTMLElement>('.opening-panel')!,
        skip: root.querySelector<HTMLElement>('.opening-skip')!,
        motion: OPENING_MOTION,
        schedule: openingSchedule(),
        onPhase: (phase, index) => {
          root.dataset.phase = phase;
          root.dataset.word = GREETINGS[index].text;
          root.dataset.locale = GREETINGS[index].locale;
        },
        onComplete: finish
      });
      timeline.current.play();
    };
    void start().catch(finish);
    const visibility = () => { if (document.hidden) finish(); };
    document.addEventListener('visibilitychange', visibility);
    // Escape hatch for a suspended/failed animation ticker, not the designed duration.
    const safetyDeadline = window.setTimeout(finish, OPENING_MOTION.safetyDeadlineMs);
    return () => {
      cancelled = true;
      clearTimeout(fontDeadline);
      clearTimeout(safetyDeadline);
      timeline.current?.kill();
      timeline.current = null;
      document.removeEventListener('visibilitychange', visibility);
      document.documentElement.classList.remove('intro-locked');
    };
  }, [finish, reduced, visible]);

  if (!visible) return null;
  return <div className="opening" ref={rootRef} role="dialog" aria-modal="true"
    aria-label="欢迎来到 Arthur 的网站" aria-describedby="opening-description"
    data-phase="loading" data-font="pending" data-lenis-prevent>
    <p className="opening-sr-only" id="opening-description">八种语言的问候，从你好到 Hello。可以跳过或按 Escape 直接进入网站。</p>
    <div className="opening-panel" aria-hidden="true" />
    <button className="opening-skip" type="button" onClick={finish}>跳过开场 <span aria-hidden="true">↗</span></button>
    <div className="opening-stage" aria-hidden="true">
      <div className="opening-lockup">
        {GREETINGS.map((greeting, index) => <div className="opening-greeting" data-script={greeting.script} key={greeting.locale} lang={greeting.locale}>
          <svg viewBox="0 0 800 180" focusable="false">
            <defs><clipPath id={`${maskId}-${index}`}><rect x="0" y="16" width="800" height="160" /></clipPath></defs>
            <g clipPath={`url(#${maskId}-${index})`}>
              {Array.from(greeting.text).map((letter, letterIndex) => <g className="opening-glyph" key={letterIndex}>
                <text className="opening-word" x="400" y="130" fontSize="100">{letter}</text>
              </g>)}
            </g>
          </svg>
        </div>)}
        <svg className="opening-accent" viewBox="0 0 800 180" focusable="false">
          <circle className="opening-dot" cx="400" cy="94" r="6" />
        </svg>
      </div>
    </div>
  </div>;
}
