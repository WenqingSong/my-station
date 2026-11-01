// A sticky scene's rectangle is its pinned position, not its document anchor.
export function anchorTop(target: HTMLElement) {
  const marker = target.matches('.work-scene') ? target.previousElementSibling : null;
  if (marker instanceof HTMLElement && marker.matches('.work-flow-marker')) {
    return scrollY + marker.getBoundingClientRect().top;
  }
  return scrollY + target.getBoundingClientRect().top;
}

export function navigationInset() {
  const header = document.querySelector<HTMLElement>('.site-header');
  return Math.ceil(header ? header.getBoundingClientRect().bottom + 12 : 76);
}

export function hashTarget(hash: string) {
  try { return document.getElementById(decodeURIComponent(hash.slice(1)) || 'top'); }
  catch { return null; }
}

export function anchorDestination(target: HTMLElement) {
  return Math.max(0, anchorTop(target) - (target.id === 'top' ? 0 : navigationInset()));
}
