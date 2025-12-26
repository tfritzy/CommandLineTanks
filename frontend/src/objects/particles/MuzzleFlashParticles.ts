import { UNIT_TO_PIXEL } from "../../constants";
import { isPointInViewport } from "../../utils/viewport";

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

export class MuzzleFlashParticles {
  private particles: Particle[] = [];
  private isDead = false;

  constructor(x: number, y: number, angle: number) {
    const colors = ["#fcfbf3", "#fceba8", "#f5c47c", "#e39764"];
    
    const particleCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
      const angleOffset = (Math.random() - 0.5) * 0.8;
      const particleAngle = angle + angleOffset;
      
      const speed = 3 + Math.random() * 4;
      
      this.particles.push({
        x,
        y,
        velocityX: Math.cos(particleAngle) * speed,
        velocityY: Math.sin(particleAngle) * speed,
        size: 0.03 + Math.random() * 0.04,
        lifetime: 0,
        maxLifetime: 0.08 + Math.random() * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  public update(deltaTime: number): void {
    let allDead = true;
    for (const p of this.particles) {
      p.lifetime += deltaTime;
      if (p.lifetime < p.maxLifetime) {
        p.x += p.velocityX * deltaTime;
        p.y += p.velocityY * deltaTime;
        p.velocityX *= 0.92;
        p.velocityY *= 0.92;
        allDead = false;
      }
    }
    this.isDead = allDead;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    ctx.save();

    for (const p of this.particles) {
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
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
