import { UNIT_TO_PIXEL } from "../../constants";
import { setGlow, clearGlow, NEON_GLOW_BLUR_LARGE } from "../../utils/neon";

interface Particle {
  x: number;
  y: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

export function drawExplosionParticles(
  ctx: CanvasRenderingContext2D,
  particle: Particle
) {
  ctx.save();

  const px = particle.x * UNIT_TO_PIXEL;
  const py = particle.y * UNIT_TO_PIXEL;
  const pSize = particle.size * UNIT_TO_PIXEL;

  const progress = particle.lifetime / particle.maxLifetime;
  ctx.globalAlpha = 1 - progress;
  
  setGlow(ctx, particle.color, NEON_GLOW_BLUR_LARGE);
  ctx.beginPath();
  ctx.arc(px, py, pSize, 0, Math.PI * 2);
  ctx.fillStyle = particle.color;
  ctx.fill();
  clearGlow(ctx);

  ctx.restore();
}
