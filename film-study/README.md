# Full-screen film study — glass portal

Local-only preview, 2026-10-20. Not a production replacement.

## Baseline

- Remote: `https://cnb.cool/framework-station/my-station`
- Main / fetched origin main at start: `b18e6e96aaa31bbe9c1fa3c0929a8b96d1afe315`
- Working branch: `study/film-cover`
- Previous film study checkpoint: `01c11dd`. The full-screen portal changes are isolated after this checkpoint.
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

## Framing / controls / handoff

- Fixed `100dvh` full bleed with `object-fit: cover`. **No Hero strip remains.** No added headline, name, subtitle, or visible entry text.
- Desktop framing: horizontal 50%, vertical 40%. Portrait: vertical 50%, selected shot boundaries change horizontal focal point; no tweened pan is added. See `src/film-study/crop.ts`.
- Bottom-center glass-inspired circle contains a single down arrow. Lower-right glass capsule contains sound + play/pause controls, each with a 44 × 44px target.
- Pointer movement inside the page reveals the icons; pointer leave/window blur hides them. Keyboard focus also reveals controls; touch/no-hover devices keep them available. No continuously running decorative animation.
- The film surface is a real accessible button. Clicking outside the media controls, scrolling downward, swiping upward, or pressing a supported entry key starts the complete transition. Media-button clicks never enter Hero.
- Film → Hero is a ~0.86s full-screen dissolve with slight depth movement. Hero → film takes ~0.82s. Both finish at scroll position zero; the existing Hero top aligns exactly with the viewport top.
- Return via the small up-arrow button or a **new upward gesture starting at Hero top**. Scrolling upward from lower in Hero does not accidentally return to the film.
- Transition phases reject duplicate or reverse inputs; a landing guard absorbs the rest of the initiating wheel gesture. Small wheel deltas accumulate; line/page wheel units are normalized. Held entry keys and an initiating touch gesture cannot keep scrolling the newly revealed Hero.
- Resize during a transition settles at its destination. Reduced motion switches immediately without the dissolve. Inactive scenes are `inert`, focus moves to the arriving scene, and browser scroll restoration is restored on cleanup.
- Sound starts **off on every load/refresh** and on history restoration. No preference is stored. Only explicit activation of the sound button can unmute; it does not force a paused video to play.
- Video continues through the reveal, then pauses when Hero is active. It also pauses when the document is hidden. Manual pause persists across scene changes. Reduced-motion preference opts out of autoplay; manual play remains available.
- The unchanged Hero is embedded for the transition study only. Its project/contact links open the existing main app at the matching anchor.

## Actual checks

- Build passed; six portal policy/source checks, five film-study source/packaging checks and fourteen existing opening/work checks passed (25 total).
- Ordinary production output does not contain the film, poster, or film-study entry.
- Initial material/framing study: in-app browser 1440 × 900 and 390 × 844 screenshots, with several portrait shots and the end card inspected. Those earlier images include the now-removed strip.
- New portal: desktop full-screen film inspected with the glass controls revealed. Clicking the film reached `phase=hero`, `scrollY=0`, `Hero.top=0`; scrolling upward returned to film. Repeated down-scroll and reverse keyboard input during the transition still landed at Hero top.
- New portal 390 × 844 check: film height equals viewport height, no horizontal overflow, entering Hero lands at zero. Hero scrolls normally below the fold; scrolling back to its top does not return to film until a new upward gesture.
- Resized from 390 × 844 to 1440 × 900 while the observed phase was `entering`; it settled at `hero`, `scrollY=0`, `Hero.top=0`.
- New portal captures: `film-study/captures/portal-film-desktop.jpg`, `portal-film-mobile.jpg`, and `portal-hero-desktop.jpg`.
- Complete native playback reached a second cycle (diagnostic loop count 1); no captured browser warnings/errors at that check.
- Sound button changes muted state on explicit click; reload restores muted state.
- Enter and Space toggle sound; doing so while paused leaves playback paused.
- Portal sound/pause controls changed only media state and remained in the film scene. Arriving at Hero paused the video.
- Source and copied-original hashes match. Existing application files remain unchanged from the baseline.

These are browser viewport checks, **not physical iPhone/Android testing**. The final slow-wheel/key-repeat/touch-gesture protections passed policy/source tests, not hardware tests for every input device. Reduced-motion branch is implemented but not asserted as OS-level tested. Device audio output / speaker quality has not been independently listened to here; the original audio track is preserved and browser mute/unmute state was tested. The final captured browser warning/error list was empty.

## Limitations / acceptance gate

1. 480 × 360 at roughly 12 fps cannot become crisp or high-frame-rate through CSS. Full-screen softness, grain and cadence are intrinsic to this source.
2. At 390 × 844 the portrait crop retains only about 36% of the source width. Main subjects were reframed for selected shots, but ensemble scenes and peripheral details cannot all survive full bleed. This still needs the user's aesthetic acceptance.
3. The original contains an early dark leader, a bright white transition around 56s, and an Apple / “Think different.” end card. These are **source content**, not newly added page text or loading glitches.
4. The end fades toward dark and the next cycle begins dark. Playback loops, but is **not a seamless visual or audio loop**. No crossfade or soundtrack edit has been introduced.
5. Autoplay can still be blocked by a device/browser policy; the poster and explicit play button remain available.
6. Production replacement remains deferred. This branch contains a local trial, not a deployed opening replacement.
