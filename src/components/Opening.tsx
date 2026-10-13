import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useModalFocus } from '../useModalFocus';
import './opening.css';

const SEEN_KEY = 'arthur:opening:v3';
const REVISIT_WINDOW = 24 * 60 * 60 * 1000;
const GREETINGS = [
  { text: '你好', locale: 'zh-CN', script: 'cjk', hold: .54 },
  { text: 'Hello', locale: 'en', script: 'latin', hold: .54 },
  { text: 'Bonjour', locale: 'fr', script: 'latin', hold: .54 },
  { text: 'こんにちは', locale: 'ja', script: 'cjk', hold: .60 }
];

function shouldPlay(reduced: boolean) {
  if (reduced || (location.hash && location.hash !== '#top')) return false;
  // An explicit replay link is useful for reviewing the opening without clearing browser data.
  if (new URLSearchParams(location.search).get('intro') === 'replay') return true;
  try {
    const seen = Number(localStorage.getItem(SEEN_KEY));
    return !seen || Date.now() - seen >= REVISIT_WINDOW || seen > Date.now();
  } catch { return true; } // Private browsing/storage restrictions must not break entry.
}

type Props = { reduced: boolean; onComplete?: () => void };

export default function Opening({ reduced, onComplete }: Props) {
  const [visible, setVisible] = useState(() => shouldPlay(reduced));
  const presented = useRef(visible);
  const rootRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const completed = useRef(false);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    timeline.current?.kill();
    timeline.current = null;
    document.documentElement.classList.remove('intro-locked');
    if (presented.current) {
      try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* Optional preference only. */ }
    }
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
          document.fonts.load('500 100px OpeningLatin', 'HelloBonjour'),
          document.fonts.load('500 100px OpeningCJK', '你好こんにちは')
        ]).then(faces => faces.every(group => group.length > 0 && group.every(face => face.status === 'loaded')), () => false);
      } catch { ready = Promise.resolve(false); }
      const loaded = await Promise.race([
        ready,
        new Promise<boolean>(resolve => { fontDeadline = window.setTimeout(() => resolve(false), 450); })
      ]);
      clearTimeout(fontDeadline);
      if (cancelled || completed.current) return;
      root.dataset.font = loaded ? 'custom' : 'system';

      const words = root.querySelectorAll<SVGTextElement>('.opening-word');
      const context = document.createElement('canvas').getContext('2d');
      // Every word sits on the same SVG baseline. Match cap/ideograph ascent, not
      // the font's line box, which differs considerably between Latin and CJK.
      words.forEach(word => {
        if (!context) return;
        context.font = '500 100px ' + getComputedStyle(word).fontFamily;
        const ascent = context.measureText(word.textContent || '').actualBoundingBoxAscent;
        if (ascent > 0) word.setAttribute('font-size', String(Math.min(150, Math.max(70, 7200 / ascent))));
      });

      const sequence = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish });
      timeline.current = sequence;
      GREETINGS.forEach((greeting, index) => {
        const mask = root.querySelectorAll<HTMLElement>('.opening-greeting')[index];
        sequence
          .call(() => { root.dataset.phase = 'enter'; root.dataset.word = greeting.text; })
          .set(mask, { visibility: 'visible' })
          .fromTo(mask, { y: 12, opacity: 1, clipPath: 'inset(100% 0 0 0)' },
            { y: 0, clipPath: 'inset(0% 0 0 0)', duration: .16 })
          .call(() => { root.dataset.phase = 'hold'; })
          .to(mask, { duration: greeting.hold })
          .call(() => { root.dataset.phase = 'leave'; })
          .to(mask, { y: -12, clipPath: 'inset(0 0 100% 0)', duration: .12, ease: 'power2.in' })
          .set(mask, { visibility: 'hidden' });
      });
      // One curtain; the already-composed Hero underneath remains untouched.
      const curtainAt = sequence.duration() - .12;
      sequence
        .call(() => { root.dataset.phase = 'curtain'; }, [], curtainAt)
        .to(root.querySelector('.opening-panel'), { yPercent: -101, duration: .64, ease: 'power3.inOut' }, curtainAt)
        .to(root.querySelector('.opening-skip'), { opacity: 0, duration: .15 }, curtainAt);
    };
    void start();
    const visibility = () => { if (document.hidden) finish(); };
    document.addEventListener('visibilitychange', visibility);
    // Escape hatch for a suspended/failed animation ticker, not the designed duration.
    const safetyDeadline = window.setTimeout(finish, 6500);
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
    <p className="opening-sr-only" id="opening-description">四种语言的问候。可以跳过或按 Escape 直接进入首页。</p>
    <div className="opening-panel" aria-hidden="true" />
    <button className="opening-skip" type="button" onClick={finish}>跳过开场 <span aria-hidden="true">↗</span></button>
    <div className="opening-stage" aria-hidden="true">
      {GREETINGS.map(greeting => <div className="opening-greeting" data-script={greeting.script} key={greeting.locale} lang={greeting.locale}>
        <svg viewBox="0 0 800 180" focusable="false">
          <text className="opening-word" x="400" y="124" textAnchor="middle" fontSize="100">{greeting.text}</text>
        </svg>
      </div>)}
    </div>
  </div>;
}
