import { UNIT_TO_PIXEL } from "../../constants";
import { isPointInViewport } from "../../utils/viewport";

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
  particles: Particle[],
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  ctx.save();

  for (const p of particles) {
    if (p.lifetime >= p.maxLifetime) continue;

    const px = p.x * UNIT_TO_PIXEL;
    const py = p.y * UNIT_TO_PIXEL;
    const pSize = p.size * UNIT_TO_PIXEL;
    
    if (!isPointInViewport(px, py, pSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
      continue;
    }

    const alpha = 1 - p.lifetime / p.maxLifetime;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}
