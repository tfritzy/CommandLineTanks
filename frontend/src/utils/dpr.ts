export function getNormalizedDPR(): number {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(dpr * 2) / 2;
}
