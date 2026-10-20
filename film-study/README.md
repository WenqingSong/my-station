# Full-screen film study — Task 1

Local-only preview, 2026-10-20. Not a production replacement.

## Baseline

- Remote: `https://cnb.cool/framework-station/my-station`
- Main / fetched origin main at start: `b18e6e96aaa31bbe9c1fa3c0929a8b96d1afe315`
- Working branch: `study/film-cover`
- Baseline worktree was clean; local and remote main had zero ahead/behind commits.
- Existing app, Hero, Opening, scroll motion, page content and build entries are unchanged.
- To return to the baseline after preserving any subsequent local changes, switch back to `main`. No destructive reset is needed.

## Preview

Run `npm run dev -- --host 127.0.0.1 --port 4176 --strictPort` from the repository, then open:

- Normal study: `http://127.0.0.1:4176/film-study/`
- Diagnostic timeline (not user-facing): `http://127.0.0.1:4176/film-study/?review=1`
- Screenshot at six seconds: `http://127.0.0.1:4176/film-study/?at=6&still=1`

The film is a separate Vite development entry, not a production build entry. Media and captures are ignored by Git and excluded from the ordinary production output. The normal root URL still serves the unchanged main app. Nothing has been deployed by this task.

## Media

Source: `/Users/songwenqing/Documents/备份/videoplayback.mp4`.

- Exact local copy: `film-study/media/original.mp4`.
- SHA-256: `d86d1e28f4195f0c037870642ec6e449db87b29a2fff36227c89c321d45a0f09`.
- Source metadata: 480 × 360, 4:3, about 61.10 seconds, nominal 11.947 fps, one audio track.
- All 730 video frames decoded successfully with AVFoundation.
- Poster: native-size JPEG from source time 1.674 seconds. No synthetic sharpening, frame interpolation, or AI upscaling.
- After the user's audio update, playback uses the **complete original**, not the earlier silent/trimmed experiment. Audio and video are neither cut nor re-encoded.
- Initial loading holds the poster through the source's dark leader; the original timeline plays underneath. Native dark frames remain in subsequent loops.

`original.mp4` and `poster.jpg` are local prerequisites, intentionally not uploaded. Public display permission for the supplied film has not been established. A fresh clone must receive those local assets before using the study.

## Framing / controls

- Full bleed with `object-fit: cover`; no added headline, name, subtitle, arrow, or entry label on the film.
- Desktop framing: horizontal 50%, vertical 40%. Hero peek is 3.5svh, bounded to 24–40px (31.5px at 1440 × 900).
- Portrait framing: vertical 50%, 24px real Hero peek. Selected shot boundaries use a different horizontal focal point; no tweened pan/zoom is added. See `src/film-study/crop.ts`.
- The visible strip is the actual unchanged Hero, including its existing cream/blue artwork, not a decorative overlay.
- Native scrolling exposes Hero immediately; no scroll hijack, opening lock, pinning, or elaborate transition is implemented in Task 1.
- Quiet lower-right capsule: sound icon + play/pause icon, each with a 44 × 44px target. Focus and press states remain visible. The accessible labels do not overlay the film.
- Sound starts **off on every load/refresh** and on history restoration. No preference is stored. Only explicit activation of the sound button can unmute; it does not force a paused video to play.
- Video pauses when fully outside the viewport or the document is hidden. Reduced-motion preference opts out of autoplay; manual play remains available.

## Actual checks

- Build passed; five film-study source/packaging contracts and fourteen existing opening/work contracts passed (19 total).
- Ordinary production output does not contain the film, poster, or film-study entry.
- In-app browser: 1440 × 900 desktop and 390 × 844 portrait screenshots, with several portrait shots and the end card inspected.
- Complete native playback reached a second cycle (diagnostic loop count 1); no captured browser warnings/errors at that check.
- Sound button changes muted state on explicit click; reload restores muted state.
- Enter and Space toggle sound; doing so while paused leaves playback paused.
- Pause/resume and scrolling completely out of the film pause correctly.
- Source and copied-original hashes match. Existing application files remain unchanged from the baseline.

These are browser viewport checks, **not physical iPhone/Android testing**. Reduced-motion branch is implemented but not asserted as OS-level tested. Device audio output / speaker quality has not been independently listened to here; the original audio track is preserved and browser mute/unmute state was tested.

## Limitations / acceptance gate

1. 480 × 360 at roughly 12 fps cannot become crisp or high-frame-rate through CSS. Full-screen softness, grain and cadence are intrinsic to this source.
2. At 390 × 844 the portrait crop retains only about 36% of the source width. Main subjects were reframed for selected shots, but ensemble scenes and peripheral details cannot all survive full bleed. This still needs the user's aesthetic acceptance.
3. The original contains an early dark leader, a bright white transition around 56s, and an Apple / “Think different.” end card. These are **source content**, not newly added page text or loading glitches.
4. The end fades toward dark and the next cycle begins dark. Playback loops, but is **not a seamless visual or audio loop**. No crossfade or soundtrack edit has been introduced.
5. Autoplay can still be blocked by a device/browser policy; the poster and explicit play button remain available.
6. Complex video-to-Hero transitions and production replacement are deliberately deferred until the framing is approved.
