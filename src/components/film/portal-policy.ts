// Shared by the production opening and its isolated policy tests.
export type PortalPhase = 'film' | 'entering' | 'hero' | 'returning';
export type PortalDestination = 'film' | 'hero';

export function nextPortalPhase(phase: PortalPhase, destination: PortalDestination): PortalPhase {
  if (phase === 'film' && destination === 'hero') return 'entering';
  if (phase === 'hero' && destination === 'film') return 'returning';
  return phase;
}

// Absorb the remainder of the same trackpad gesture after a transition lands.
// A fresh gesture after an idle interval releases the landing lock.
export class LandingGuard {
  private lastInput = -Infinity;
  private until = 0;
  private armed = false;
  start(now: number) { this.armed = true; this.lastInput = now; this.until = Infinity; }
  land(now: number) { this.until = now + 120; }
  consume(now: number) {
    const sameGesture = now - this.lastInput < 200;
    this.lastInput = now;
    if (!this.armed) return false;
    if (now < this.until || sameGesture) return true;
    this.armed = false;
    return false;
  }
}

export function canReturnToFilm(scrollTop: number, startedAtTop: boolean, deltaY: number) {
  return scrollTop <= 1 && startedAtTop && deltaY < -6;
}

// Small trackpad deltas accumulate; line/page wheel devices use the same threshold.
export class WheelIntent {
  private total = 0;
  reset() { this.total = 0; }
  add(delta: number, mode: number, pageHeight: number) {
    const pixels = delta * (mode === 1 ? 16 : mode === 2 ? pageHeight : 1);
    if (pixels && Math.sign(pixels) !== Math.sign(this.total)) this.total = 0;
    this.total += pixels;
    return Math.abs(this.total) >= 12 ? this.total : 0;
  }
}
