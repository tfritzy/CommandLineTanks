export const NEON_GLOW_BLUR_SMALL = 8;
export const NEON_GLOW_BLUR_MEDIUM = 16;
export const NEON_GLOW_BLUR_LARGE = 24;
export const NEON_GLOW_BLUR_INTENSE = 40;

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getNeonFillColor(hex: string): string {
  return hexToRgba(hex, 0.15);
}

export function getNeonShadowColor(hex: string): string {
  return hexToRgba(hex, 0.25);
}

export function setGlow(ctx: CanvasRenderingContext2D, color: string, blur: number): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function clearGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function drawGlowingStroke(
  ctx: CanvasRenderingContext2D,
  color: string,
  lineWidth: number,
  blur: number
): void {
  setGlow(ctx, color, blur);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  clearGlow(ctx);
}

export function drawGlowingFill(
  ctx: CanvasRenderingContext2D,
  color: string,
  blur: number
): void {
  setGlow(ctx, color, blur);
  ctx.fillStyle = color;
  ctx.fill();
  clearGlow(ctx);
}

export function multiPassGlow(
  ctx: CanvasRenderingContext2D,
  color: string,
  drawFn: () => void,
  passes: number = 2
): void {
  for (let i = 0; i < passes; i++) {
    const blur = NEON_GLOW_BLUR_MEDIUM * (passes - i);
    setGlow(ctx, color, blur);
    drawFn();
  }
  clearGlow(ctx);
  drawFn();
}
