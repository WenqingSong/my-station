# Production film opening — 2026-10-20

## Scope and rollback

- Baseline: `1310ee841356586f654dfaeefb5e8f75ffb69c94`.
- Implementation branch: `work/production-film-opening`.
- The normal `/` entry now mounts the film and the **complete** portfolio.
- Removed the old Hello component, language schedule, timeline and stylesheet.
- Moved the approved portal/crop implementation into `src/components/film/`.
- Kept FirstHero, SelectedWork, AboutEditorial, Contact content and shared scroll reveals. Regression tests compare the retained Hero/About/Contact and shared reveal code against the established baseline.
- To undo this change, revert the production-film commit on main; do not reset or force-push remote history.

## Delivery

- `public/media/think-different.mp4`: 3,537,167 bytes, exact original including audio.
- SHA-256: `d86d1e28f4195f0c037870642ec6e449db87b29a2fff36227c89c321d45a0f09`.
- `public/media/think-different-poster.jpg`: original trial poster.
- Normal Vite build copies both into `dist/media/`; the existing Dockerfile copies the entire dist.
- `prebuild` fails if the approved video or poster is missing/corrupt.
- Nginx `/media/` uses actual-file lookup, not the SPA HTML fallback.
- No object-storage account, manual upload, external media URL or new dependency.
- Code push is not proof that a production server has deployed the new image.

## Automated checks

`npm run build` and `node --test qa/*.test.mjs`: **21 passing**.

Coverage includes legal portal state transitions, wheel intent and inertia,
scoped input interception, Lenis lock/reset wiring, original media identity,
missing-asset build failure, normal production packaging, absence of the old
greeting sequence, retained work scenes and section anchors.

These policy and source-contract tests are not substitutes for device tests.

## Browser checks performed against the production build

Served `dist` with Vite preview at `http://127.0.0.1:4176/`, not the study entry.

- Root starts with the full-screen movie, original 480px source, muted and playing.
- No added visible headline, name or entry text over the video.
- Click entry: phase settles to Hero; `scrollY=0`, `#top.top=0`; film pauses.
- Desktop wheel and keyboard entry work; return control restores the full-screen movie.
- Media controls remain in the film scene. Space on sound while paused toggles mute without starting playback. Reload resets muted=true.
- Full-site links reach SurgeCart, About and Contact; Work scroll scenes remain active. Back to top lands at Hero without immediately returning to the film.
- 390×844 viewport: film is exactly 390×844, no horizontal overflow; downward wheel entry lands at Hero top. The five navigation controls fit; the rest of Hero can scroll normally.
- Resize during return settles to the full film at scroll zero.
- Fresh `/#work-backend` load starts with film; after entering, the retained deep-link behavior lands the requested project below the fixed navigation.
- `/?entry=offer` opens the existing confirmation only after entering the site. Its parameter is consumed once; arrow keys in the dialog do not switch scenes; Escape closes it.
- Existing `?hero-review=still` exercises the reduced-transition branch: movie stays paused/muted; Escape lands immediately at Hero top.
- Video byte-range response: HTTP 206, `Content-Type: video/mp4`, `Content-Range: bytes 0-1023/3537167`.
- Final browser console capture: no warning/error entries.

Local screenshots (ignored by Git):

- `film-study/captures/production-film-desktop.jpg`
- `film-study/captures/production-film-mobile.jpg`
- `film-study/captures/production-hero-mobile.jpg`

## Explicit limits

- Browser viewport checks are not physical iPhone/Android touch-device tests.
- Reduced motion was exercised through the existing review flag, not by changing OS preferences.
- Original sound track and browser mute states were checked; physical speaker output was not independently auditioned.
- No Docker daemon build or live server deployment was run in this task.
- Original film is 480×360, about 12fps and not a seamless audio/video loop. No upscaling, interpolation or soundtrack trimming was introduced.
