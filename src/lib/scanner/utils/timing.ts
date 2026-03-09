export function computeScanInterval(targetScansPerSecond: number): number {
  return Math.max(50, Math.floor(1000 / Math.max(targetScansPerSecond, 1)));
}
