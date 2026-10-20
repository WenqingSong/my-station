// Shot-boundary crop adjustments, inspected against the original 480 × 360 film.
// This is framing, not a tracking/panning effect. Wide ensembles still lose context.
export function portraitFocalPoint(time: number): number {
  if (time < 6.780) return 20;
  if (time >= 17.661 && time < 21.009) return 22;
  if (time >= 45.032 && time < 46.790) return 66;
  if (time >= 46.790 && time < 49.301) return 60;
  return 50;
}
