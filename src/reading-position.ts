export type ReadingPoint = { id: string; progress: number };
export type ReadingRegion = { id: string; top: number; height: number };

export function captureReadingPoint(regions: ReadingRegion[], line: number): ReadingPoint | null {
  const region = [...regions].reverse().find(item => item.top <= line);
  if (!region) return null;
  return { id: region.id, progress: Math.min(1, Math.max(0, (line - region.top) / Math.max(1, region.height))) };
}

export function restoreReadingPoint(point: ReadingPoint, regions: ReadingRegion[], inset: number) {
  const region = regions.find(item => item.id === point.id);
  return region ? Math.max(0, region.top + region.height * point.progress - inset) : null;
}
