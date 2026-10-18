// A tall scene scrolls all its copy into view before it sticks. The trailing
// breathing room is real scroll distance, not a timer or wheel interception.
export function workSceneMetrics(height: number, viewport: number) {
  return {
    top: Math.min(0, viewport - height),
    hold: Math.round(Math.max(240, viewport * .38)),
  };
}
