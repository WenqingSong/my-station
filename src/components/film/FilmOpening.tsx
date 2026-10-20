import { useEffect, useRef, useState, type RefObject } from 'react';
import { portraitFocalPoint } from './crop';
import './film.css';

const filmUrl = '/media/think-different.mp4';
const posterUrl = '/media/think-different-poster.jpg';

type Props = {
  stageRef: RefObject<HTMLElement>;
  active: boolean;
  reduced: boolean;
  enterHero: () => void;
};

export default function FilmOpening({ stageRef, active, reduced, enterHero }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const explicitlyPlaying = useRef(false);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);

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
  }, [stageRef]);

  useEffect(() => { explicitlyPlaying.current = false; }, [reduced]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let mounted = true;
    const sync = () => {
      if (!active || document.hidden || manuallyPaused.current || (reduced && !explicitlyPlaying.current)) video.pause();
      else void video.play().catch(() => { if (mounted) setPaused(true); });
    };
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { mounted = false; document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, [reduced, active]);

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
    // Only an explicit sound-button action may unmute; never persist the choice.
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return <section className={`film-stage${ready ? ' is-ready' : ''}`} ref={stageRef}
    data-pointer-inside={pointerInside} aria-label="个人灵感影片，默认静音循环播放"
    onPointerMove={event => { if (event.pointerType === 'mouse') setPointerInside(true); }}
    onPointerLeave={() => setPointerInside(false)}>
    <img className="film-poster" src={posterUrl} alt="" aria-hidden="true" fetchPriority="high" />
    <video ref={videoRef} className="film-video" src={filmUrl} poster={posterUrl}
      muted={muted} playsInline loop preload={reduced ? 'metadata' : 'auto'} aria-hidden="true" tabIndex={-1}
      onSeeked={() => setReady(true)}
      onPlaying={event => { if (event.currentTarget.currentTime >= 1.674) setReady(true); setPaused(false); }}
      onPause={() => setPaused(true)}
      onVolumeChange={event => setMuted(event.currentTarget.muted)}
      onError={() => { setFailed(true); setPaused(true); setReady(false); }}
      onTimeUpdate={event => {
        // Cover the initial dark leader with a real frame, keeping the original
        // soundtrack and full timeline intact. Subsequent loops stay unedited.
        if (!ready && event.currentTarget.currentTime >= 1.674) setReady(true);
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
  </section>;
}
