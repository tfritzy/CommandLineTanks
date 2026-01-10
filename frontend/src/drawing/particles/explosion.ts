import { UNIT_TO_PIXEL } from "../../constants";

interface Particle {
  x: number;
  y: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

const TWO_PI = Math.PI * 2;

export function drawExplosionParticles(
  ctx: CanvasRenderingContext2D,
  particle: Particle
) {
  const px = particle.x * UNIT_TO_PIXEL;
  const py = particle.y * UNIT_TO_PIXEL;
  const pSize = particle.size * UNIT_TO_PIXEL;

  const progress = particle.lifetime / particle.maxLifetime;
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = 1 - progress;
  
  ctx.beginPath();
  ctx.arc(px, py, pSize, 0, TWO_PI);
  ctx.fillStyle = particle.color;
  ctx.fill();

  ctx.globalAlpha = prevAlpha;
}
