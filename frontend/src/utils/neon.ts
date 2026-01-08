export const NEON_GLOW_BLUR_SMALL = 4;
export const NEON_GLOW_BLUR_MEDIUM = 8;
export const NEON_GLOW_BLUR_LARGE = 12;
export const NEON_GLOW_BLUR_INTENSE = 20;

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
