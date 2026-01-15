import { UNIT_TO_PIXEL } from "../../constants";
import type { TreeParticle } from "../../objects/particles/TreeDestructionParticles";

export function drawTreeDestructionParticle(
  ctx: CanvasRenderingContext2D,
  particle: TreeParticle
) {
  if (particle.lifetime >= particle.maxLifetime) return;

  const px = particle.x * UNIT_TO_PIXEL;
  const py = particle.y * UNIT_TO_PIXEL;
  const progress = particle.lifetime / particle.maxLifetime;
  
  // Leaves shrink as they fall (drift away)
  const sizeScale = particle.type === 'leaf' ? (1 - progress) : 1;
  const pSize = particle.size * UNIT_TO_PIXEL * sizeScale;
  
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.fillStyle = particle.color;
  ctx.translate(px, py);
  ctx.rotate(particle.rotation);

  if (particle.type === 'stick') {
    // Draw a stick (rectangle)
    const length = pSize;
    const thickness = UNIT_TO_PIXEL * 0.12;
    ctx.fillRect(-length / 2, -thickness / 2, length, thickness);
  } else {
    // Draw a leaf (small oval or circle)
    const w = pSize;
    const h = pSize * 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
