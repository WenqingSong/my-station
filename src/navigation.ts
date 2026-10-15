// The fixed header changes size with the viewport; every navigation path uses
// the same offset. Invalid fragments remain harmless, ordinary links.
export function fragmentId(hash: string) {
  try { return decodeURIComponent(hash.replace(/^#/, '')); } catch { return ''; }
}

export function navigationOffset(headerBottom: number, viewportHeight: number) {
  return Math.ceil(Math.min(Math.max(0, headerBottom) + 16, viewportHeight * .4));
}

export function navigationDuration(distance: number, viewportHeight: number) {
  return Math.min(1.15, Math.max(.35, Math.abs(distance) / Math.max(1, viewportHeight) * .18 + .35));
}
