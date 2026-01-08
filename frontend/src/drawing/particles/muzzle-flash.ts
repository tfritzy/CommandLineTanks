import { UNIT_TO_PIXEL } from "../../constants";
import { setGlow, clearGlow, NEON_GLOW_BLUR_LARGE } from "../../utils/neon";

const TWO_PI = Math.PI * 2;

interface Particle {
  x: number;
  y: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

export function drawMuzzleFlashParticles(
  ctx: CanvasRenderingContext2D,
  particle: Particle
): void {
  ctx.save();

  const px = particle.x * UNIT_TO_PIXEL;
  const py = particle.y * UNIT_TO_PIXEL;
  const pSize = particle.size * UNIT_TO_PIXEL;

  const alpha = 1 - particle.lifetime / particle.maxLifetime;
  ctx.globalAlpha = alpha;

  setGlow(ctx, particle.color, NEON_GLOW_BLUR_LARGE);
  ctx.fillStyle = particle.color;
  
  ctx.beginPath();
  ctx.arc(px, py, pSize, 0, TWO_PI);
  ctx.fill();
  clearGlow(ctx);

  ctx.restore();
}
