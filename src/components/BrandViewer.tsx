import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './brand-viewer.css';

type Player = { cancel(): void; pause(): void; play(): void; finish(options: { surface: HTMLElement }): Promise<void> };
type MotionRuntime = { create(svg: SVGSVGElement, options: { loop: boolean }): Player };

export default function BrandViewer({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const playerRef = useRef<Player>();
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [available, setAvailable] = useState(true);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const create = () => {
      playerRef.current?.cancel();
      const runtime = (window as Window & { FrameworkMotion?: MotionRuntime }).FrameworkMotion;
      playerRef.current = runtime?.create(svgRef.current!, { loop: true });
      setAvailable(Boolean(runtime));
      setReduced(preference.matches);
      setPaused(false);
    };
    const focused = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add('brand-viewing');
    dialog.showModal();
    create();
    preference.addEventListener('change', create);
    return () => {
      preference.removeEventListener('change', create);
      playerRef.current?.cancel();
      dialog.close();
      document.documentElement.classList.remove('brand-viewing');
      focused?.focus({ preventScroll: true });
    };
  }, []);

  const exit = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    try { await playerRef.current?.finish({ surface: dialogRef.current! }); }
    finally { onClose(); }
  };
  const togglePlayback = () => {
    if (paused) playerRef.current?.play(); else playerRef.current?.pause();
    setPaused(!paused);
  };

  return createPortal(<dialog className="brand-viewer" ref={dialogRef} aria-labelledby="brand-viewer-title" data-lenis-prevent onCancel={event => { event.preventDefault(); void exit(); }}>
    <header className="brand-viewer-header"><span id="brand-viewer-title">FRAMEWORK <span>/ MOTION STUDY</span></span><button type="button" autoFocus onClick={() => void exit()} disabled={closing}>返回网站 <span aria-hidden="true">×</span></button></header>
    <div className="brand-viewer-center">
      <svg ref={svgRef} viewBox="0 0 256 256" aria-hidden="true"><path d="M128 28 44 76.5V173.5L112.6 213.1M44 76.5 128 125V229M128 28 212 76.5V157" fill="none" stroke="currentColor" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <p>FRAMEWORK</p>
    </div>
    <footer className="brand-viewer-footer"><span>{!available ? '品牌标识' : reduced ? '已遵循系统减少动效设置' : '形成立体 · 留白 · 再次展开'}</span>{available && !reduced && <button type="button" onClick={togglePlayback} disabled={closing} aria-pressed={paused}>{paused ? '继续播放 ▷' : '暂停 Ⅱ'}</button>}<span className="brand-viewer-escape">ESC 退出</span></footer>
  </dialog>, document.body);
}
