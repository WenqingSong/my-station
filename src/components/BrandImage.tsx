import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import './brand-image.css';

const images = new Map<string, { image: HTMLImageElement; promise: Promise<void>; ready: boolean }>();
export function preloadImage(src: string) {
  const cached = images.get(src);
  if (cached) return cached.promise;
  const image = new Image();
  const entry = { image, ready: false, promise: Promise.resolve() };
  entry.promise = new Promise<void>((resolve, reject) => {
    image.onload = async () => {
      try { await image.decode(); entry.ready = true; resolve(); }
      catch (error) { images.delete(src); reject(error); }
    };
    image.onerror = () => { images.delete(src); reject(new Error('图片暂未载入')); };
    image.src = src;
  });
  images.set(src, entry);
  return entry.promise;
}
export function BrandLoading() {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const runtime = (window as Window & { FrameworkMotion?: { create(svg: SVGSVGElement, options: { loop: boolean }): { cancel(): void } } }).FrameworkMotion;
    const player = svgRef.current && runtime?.create(svgRef.current, { loop: true });
    return () => { player?.cancel(); };
  }, []);
  return <span className="media-brand-loading" role="status" aria-label="图片加载中"><svg ref={svgRef} viewBox="0 0 256 256" aria-hidden="true"><path d="M128 28 44 76.5V173.5L112.6 213.1M44 76.5 128 125V229M128 28 212 76.5V157" fill="none" stroke="currentColor" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
}
export default function BrandImage({ src = '', alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [state, setState] = useState({ src, ready: images.get(src)?.ready ?? false, failed: false });
  const ready = state.src === src && state.ready;
  useEffect(() => {
    let alive = true;
    void preloadImage(src).then(() => { if (alive) setState({ src, ready: true, failed: false }); }, () => { if (alive) setState({ src, ready: false, failed: true }); });
    return () => { alive = false; };
  }, [src]);
  return <><img {...props} src={src} alt={alt} data-media-ready={ready} style={{ ...props.style, opacity: ready ? 1 : 0 }} />{!ready && (state.failed ? <span className="media-image-error" role="status">图片暂未载入</span> : <BrandLoading />)}</>;
}
