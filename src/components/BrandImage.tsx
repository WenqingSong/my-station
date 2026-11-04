import { useEffect, useLayoutEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import './brand-image.css';
import { observeImageReadiness } from '../image-readiness';

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
    const runtime = (window as Window & { FrameworkMotion?: { duration: number; create(svg: SVGSVGElement, options: { loop: boolean }): { currentTime: number; cancel(): void } } }).FrameworkMotion;
    const player = svgRef.current && runtime?.create(svgRef.current, { loop: true });
    // Start with the formed mark, so a short image wait is never a blank cycle.
    if (player && runtime) player.currentTime = runtime.duration * .4;
    return () => { player?.cancel(); };
  }, []);
  return <span className="media-brand-loading" role="status" aria-label="图片加载中"><span className="media-brand-content"><svg ref={svgRef} viewBox="0 0 256 256" aria-hidden="true"><path d="M128 28 44 76.5V173.5L112.6 213.1M44 76.5 128 125V229M128 28 212 76.5V157" fill="none" stroke="currentColor" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" /></svg><small aria-hidden="true">FRAMEWORK</small></span></span>;
}
export default function BrandImage({ src = '', alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const imageRef = useRef<HTMLImageElement>(null);
  // A decoded preloader does not imply this DOM image has completed revalidation.
  const [state, setState] = useState({ src, ready: false, failed: false });
  const ready = state.src === src && state.ready;
  useLayoutEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    setState({ src, ready: false, failed: false });
    return observeImageReadiness(image,
      () => setState({ src, ready: true, failed: false }),
      () => setState({ src, ready: false, failed: true }));
  }, [src]);
  return <><img {...props} key={src} ref={imageRef} src={src} alt={alt} data-media-ready={ready} style={{ ...props.style, opacity: ready ? 1 : 0 }} />{!ready && (state.src === src && state.failed ? <span className="media-image-error" role="status">图片暂未载入</span> : <BrandLoading />)}</>;
}
