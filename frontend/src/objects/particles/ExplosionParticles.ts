import { UNIT_TO_PIXEL } from "../../game";
import { isPointInViewport } from "../../utils/viewport";

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  maxSize: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

export class ExplosionParticles {
  private particles: Particle[] = [];
  private isDead = false;

  constructor(x: number, y: number, explosionRadius: number) {
    const colors = ["#fceba8", "#f5c47c", "#e39764"];
    
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Spread them out more from the center
      const dist = Math.random() * explosionRadius * 0.5;
      
      // Add some outward velocity
      const speed = 0.3 + Math.random() * 1.5;
      
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: 0,
        maxSize: explosionRadius * (0.2 + Math.random() * 0.3),
        lifetime: 0,
        maxLifetime: 0.2 + Math.random() * 0.4,
        color: colors[i % colors.length]
      });
    }
  }

  public update(deltaTime: number): void {
    let allDead = true;
    for (const p of this.particles) {
      p.lifetime += deltaTime;
      if (p.lifetime < p.maxLifetime) {
        allDead = false;
        
        // Move particles outward
        p.x += p.velocityX * deltaTime;
        p.y += p.velocityY * deltaTime;
        
        // Apply some friction
        p.velocityX *= Math.pow(0.1, deltaTime);
        p.velocityY *= Math.pow(0.1, deltaTime);

        const progress = p.lifetime / p.maxLifetime;
        // Expand quickly to max size
        p.size = p.maxSize * Math.min(1, progress * 5);
      }
    }
    this.isDead = allDead;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const p of this.particles) {
      if (p.lifetime >= p.maxLifetime) continue;

      const progress = p.lifetime / p.maxLifetime;
      ctx.globalAlpha = 1 - progress;

      const px = p.x * UNIT_TO_PIXEL;
      const py = p.y * UNIT_TO_PIXEL;
      const pSize = p.size * UNIT_TO_PIXEL;
      
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.restore();
  }

  public getIsDead(): boolean {
    return this.isDead;
  }

  public isInViewport(cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): boolean {
    for (const p of this.particles) {
      if (p.lifetime >= p.maxLifetime) continue;
      
      const px = p.x * UNIT_TO_PIXEL;
      const py = p.y * UNIT_TO_PIXEL;
      const pSize = p.size * UNIT_TO_PIXEL;
      
      if (isPointInViewport(px, py, pSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
        return true;
      }
    }
    return false;
  }
}
