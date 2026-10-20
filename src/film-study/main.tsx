/// <reference types="vite/client" />
import { StrictMode, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import FirstHero from '../components/FirstHero';
import { portraitFocalPoint } from './crop';
import { useFilmPortal } from './useFilmPortal';
import '../styles.css';
import '../components/first-hero.css';
import './study.css';

// This standalone study reuses the actual Hero without editing its source.
// The main app and its opening sequence are not mounted or changed here.
const projects = [
  { id: 'delivery', index: '01', title: 'SurgeCart', subtitle: '电商交易与秒杀系统', preview: { note: '秒杀链路：准入不等于下单成功。', steps: [['Redis Lua', '准入'], ['MySQL 请求表', '排队'], ['订单事务', '落单']] } },
  { id: 'backend', index: '02', title: 'Agent Workflow', subtitle: '基于 Git 的多 Agent 协作工具', preview: { note: '把交接与审查关联到具体提交。', steps: [['任务文件', '交接'], ['Git Commit', '绑定'], ['Go 校验器', '检查']] } },
  { id: 'matching', index: '03', title: 'Offer 捕手', subtitle: 'AI 求职匹配与简历优化工具', preview: { note: '结构不合约定，先修复，再回退。', steps: [['Schema', '校验'], ['Repair', '修复一次'], ['业务流程', '必要时回退']] } }
];
const query = new URLSearchParams(location.search);
const review = query.get('review') === '1';
const still = query.get('still') === '1';
// Keep the complete original soundtrack and timing. Sound opt-in is per visit.
const source = 'original';
const requestedTime = Math.max(0, Number(query.get('at')) || 0);
const posterTime = 1.674;

function FilmStudy() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const manuallyPaused = useRef(still);
  const explicitlyPlaying = useRef(false);
  const lastTime = useRef(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [loops, setLoops] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const { phase, enterHero, returnToFilm } = useFilmPortal(stageRef, heroRef, reduced);
  const filmActive = phase !== 'hero';
  const heroInactive = heroPaused || reduced || phase === 'film';

  useEffect(() => {
    const hide = () => setPointerInside(false);
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide(); };
    window.addEventListener('blur', hide);
    document.addEventListener('pointerout', leave);
    return () => { window.removeEventListener('blur', hide); document.removeEventListener('pointerout', leave); };
  }, []);

  useEffect(() => {
    const resetSound = () => {
      const video = videoRef.current;
      if (video) { video.defaultMuted = true; video.muted = true; }
      setMuted(true);
    };
    resetSound();
    // Also reset when the browser restores this page from its back/forward cache.
    window.addEventListener('pageshow', resetSound);
    return () => window.removeEventListener('pageshow', resetSound);
  }, []);

  useEffect(() => {
    const video = videoRef.current, stage = stageRef.current;
    if (!video || !stage) return;
    let previous = -1, frame = 0;
    const applyCrop = (time: number) => {
      const next = portraitFocalPoint(time);
      if (next !== previous) { stage.style.setProperty('--film-mobile-x', `${next}%`); previous = next; }
    };
    const update = () => applyCrop(video.currentTime);
    const onFrame: VideoFrameRequestCallback = (_, metadata) => {
      applyCrop(metadata.mediaTime);
      frame = video.requestVideoFrameCallback(onFrame);
    };
    update();
    video.addEventListener('seeked', update);
    if (typeof video.requestVideoFrameCallback === 'function') frame = video.requestVideoFrameCallback(onFrame);
    else video.addEventListener('timeupdate', update);
    return () => {
      if (frame) video.cancelVideoFrameCallback(frame);
      video.removeEventListener('seeked', update);
      video.removeEventListener('timeupdate', update);
    };
  }, []);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { explicitlyPlaying.current = false; setReduced(preference.matches); };
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stage = stageRef.current;
    if (!video || !stage) return;
    let visible = true, active = true;
    const sync = () => {
      if (!filmActive || !visible || document.hidden || manuallyPaused.current || (reduced && !explicitlyPlaying.current)) video.pause();
      else void video.play().catch(() => { if (active) setPaused(true); });
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0 });
    observer.observe(stage);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { active = false; observer.disconnect(); document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, [reduced, filmActive]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || failed) return;
    if (video.paused) {
      manuallyPaused.current = false;
      explicitlyPlaying.current = true;
      void video.play().catch(() => setPaused(true));
    } else { manuallyPaused.current = true; video.pause(); }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video || failed) return;
    // The only unmute path is this deliberate button activation (including keyboard).
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  // Existing Hero links go to the unchanged main site, not to absent sections.
  const followHero = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (anchor && anchor.hash !== '#top') anchor.href = '/' + anchor.hash;
  };

  return <main className="film-study" data-phase={phase} data-pointer-inside={pointerInside}
    onPointerMove={event => { if (event.pointerType === 'mouse') setPointerInside(true); }}
    onPointerLeave={() => setPointerInside(false)}>
    <section className={`film-stage${ready ? ' is-ready' : ''}`} ref={stageRef} aria-label="个人灵感影片，默认静音循环播放">
      <img className="film-poster" src="/film-study/media/poster.jpg" alt="" aria-hidden="true" />
      <video ref={videoRef} className="film-video" src={`/film-study/media/${source}.mp4`} poster="/film-study/media/poster.jpg"
        muted={muted} playsInline loop preload="auto" autoPlay={!reduced && !still} aria-hidden="true" tabIndex={-1}
        onLoadedMetadata={event => {
          const video = event.currentTarget;
          setDuration(video.duration);
          if (requestedTime > 0) video.currentTime = Math.min(requestedTime, video.duration - 0.1);
        }}
        onSeeked={() => setReady(true)}
        onPlaying={event => { if (event.currentTarget.currentTime >= posterTime) setReady(true); setPaused(false); }}
        onPause={() => setPaused(true)}
        onVolumeChange={event => setMuted(event.currentTarget.muted)}
        onError={() => { setFailed(true); setPaused(true); setReady(false); }}
        onTimeUpdate={event => {
          const time = event.currentTarget.currentTime;
          // Hold a real first-scene frame through the source's initial dark leader.
          // The complete audio/video timeline keeps running underneath, untrimmed.
          if (!ready && time >= posterTime) setReady(true);
          if (lastTime.current > event.currentTarget.duration - 1 && time < 1) setLoops(value => value + 1);
          lastTime.current = time;
          if (review) setElapsed(time);
        }} />
      <button className="film-enter" type="button" onClick={enterHero} aria-label="进入个人主页">
        <span className="film-entry-glass" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 5v14m-6-6 6 6 6-6" /></svg>
        </span>
      </button>
      {!failed && <div className="film-controls" role="group" aria-label="影片控制">
        <button className="film-control film-sound" type="button" onClick={toggleSound}
          aria-label="影片声音" aria-pressed={!muted}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M11 5 6 9H3v6h3l5 4Z" />
            {muted ? <><path d="m16 9 5 6" /><path d="m21 9-5 6" /></> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
          </svg>
        </button>
        <button className="film-control film-playback" type="button" onClick={togglePlayback}
        aria-label={paused ? '播放影片' : '暂停影片'} aria-pressed={!paused}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paused ? <path d="m9 5 11 7-11 7Z" /> : <><path d="M8 6v12" /><path d="M16 6v12" /></>}</svg>
        </button>
      </div>}
      {review && <aside className="film-review" aria-label="试映检查工具">
        <output>{source} · {elapsed.toFixed(2)} / {duration.toFixed(2)} s · 循环 {loops} 次 · {failed ? '载入失败' : paused ? '暂停' : '播放'} · {muted ? '静音' : '声音开启'}</output>
        <input aria-label="影片时间" type="range" min="0" max={duration || 1} step="0.1" value={elapsed} onChange={event => {
          const video = videoRef.current;
          if (!video) return;
          manuallyPaused.current = true; video.pause(); video.currentTime = Number(event.target.value); setElapsed(Number(event.target.value));
        }} />
      </aside>}
    </section>
    <div className="film-hero-context" ref={heroRef} tabIndex={-1} role="region" aria-label="Arthur 个人主页" onClick={followHero}>
      <button className="film-return" type="button" onClick={returnToFilm} aria-label="返回全屏影片">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
      </button>
      <FirstHero projects={projects} paused={heroInactive} motionDisabled={heroInactive} reduced={reduced} toggleMotion={() => setHeroPaused(value => !value)} />
    </div>
  </main>;
}

const root = createRoot(document.getElementById('root')!);
root.render(<StrictMode><FilmStudy /></StrictMode>);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
