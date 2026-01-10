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

export class ProjectileImpactParticles {
  private particles: Particle[] = [];
  private isDead = false;

  constructor(x: number, y: number, velocityX: number, velocityY: number, color: string) {
    // Splatter in opposite direction
    const oppositeX = -velocityX;
    const oppositeY = -velocityY;
    
    // Normalize opposite velocity for direction
    const speed = Math.sqrt(oppositeX * oppositeX + oppositeY * oppositeY);
    const dirX = speed > 0 ? oppositeX / speed : 0;
    const dirY = speed > 0 ? oppositeY / speed : 0;

    const particleCount = 7 + Math.floor(Math.random() * 6);
    for (let i = 0; i < particleCount; i++) {
      // Add some randomness to the direction
      const angleOffset = (Math.random() - 0.5) * 1.3; 
      const cos = Math.cos(angleOffset);
      const sin = Math.sin(angleOffset);
      
      const pDirX = dirX * cos - dirY * sin;
      const pDirY = dirX * sin + dirY * cos;
      
      const pSpeed = 2.5 + Math.random() * 3;
      
      this.particles.push({
        x, y,
        velocityX: pDirX * pSpeed,
        velocityY: pDirY * pSpeed,
        size: 0.02 + Math.random() * .03,
        lifetime: 0,
        maxLifetime: 0.2 + Math.random() * 0.2,
        color: color
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
        p.velocityX *= 0.95;
        p.velocityY *= 0.95;
        allDead = false;
      }
    }
    this.isDead = allDead;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    const prevAlpha = ctx.globalAlpha;
    const TWO_PI = Math.PI * 2;

    ctx.fillStyle = this.particles[0]?.color || '';

    // Group particles by alpha bucket
    const particlesByAlpha = new Map<number, typeof this.particles>();

    for (const p of this.particles) {
      if (p.lifetime >= p.maxLifetime) continue;

      const px = p.x * UNIT_TO_PIXEL;
      const py = p.y * UNIT_TO_PIXEL;
      const pSize = p.size * UNIT_TO_PIXEL;
      
      if (!isPointInViewport(px, py, pSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
        continue;
      }

      const alpha = 1 - p.lifetime / p.maxLifetime;
      const alphaKey = Math.round(alpha * 20) / 20; // Bucket alphas to nearest 0.05
      
      if (!particlesByAlpha.has(alphaKey)) {
        particlesByAlpha.set(alphaKey, []);
      }
      particlesByAlpha.get(alphaKey)!.push(p);
    }

    for (const [alpha, particles] of particlesByAlpha) {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      
      for (const p of particles) {
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        
        ctx.moveTo(px + pSize, py);
        ctx.arc(px, py, pSize, 0, TWO_PI);
      }
      
      ctx.fill();
    }
    
    ctx.globalAlpha = prevAlpha;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
