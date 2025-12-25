import { UNIT_TO_PIXEL } from "../../game";

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
  particles: Particle[]
) {
  ctx.save();

  for (const p of particles) {
    if (p.lifetime >= p.maxLifetime) continue;

    const px = p.x * UNIT_TO_PIXEL;
    const py = p.y * UNIT_TO_PIXEL;
    const pSize = p.size * UNIT_TO_PIXEL;

    const progress = p.lifetime / p.maxLifetime;
    ctx.globalAlpha = 1 - progress;
    
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.restore();
}
