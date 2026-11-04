// Preloading is a hint. Only the actual rendered element can release its cover.
export function observeImageReadiness(image: HTMLImageElement, ready: () => void, failed: () => void) {
  let alive = true;
  let decoding = false;
  let settled = false;
  const error = () => {
    if (!alive || settled) return;
    settled = true;
    failed();
  };
  const load = async () => {
    if (!alive || settled || decoding || !image.complete) return;
    if (!image.naturalWidth) { error(); return; }
    decoding = true;
    try {
      await image.decode();
      if (alive && !settled && image.complete && image.naturalWidth > 0) {
        settled = true;
        ready();
      }
    } catch { error(); }
  };
  image.addEventListener('load', load);
  image.addEventListener('error', error);
  void load();
  return () => {
    alive = false;
    image.removeEventListener('load', load);
    image.removeEventListener('error', error);
  };
}
