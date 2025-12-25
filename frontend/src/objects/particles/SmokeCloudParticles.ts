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
  rotationSpeed: number;
  rotation: number;
}

export class SmokeCloudParticles {
  private particles: Particle[] = [];
  private isDead = false;
  private isEmitting = true;
  private timeSinceLastEmit = 0;
  private emitInterval = 0.15;
  private centerX: number;
  private centerY: number;
  private radius: number;

  constructor(x: number, y: number, radius: number) {
    this.centerX = x;
    this.centerY = y;
    this.radius = radius;
    
    for (let i = 0; i < 10; i++) {
      this.emitParticle();
    }
  }

  private emitParticle(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.radius * 0.3;
    
    const speed = 0.1 + Math.random() * 0.3;
    
    this.particles.push({
      x: this.centerX + Math.cos(angle) * dist,
      y: this.centerY + Math.sin(angle) * dist,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      size: 0,
      maxSize: this.radius * (0.4 + Math.random() * 0.4),
      lifetime: 0,
      maxLifetime: 3.0 + Math.random() * 1.5,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * Math.PI * 2
    });
  }

  public stopEmitting(): void {
    this.isEmitting = false;
  }

  public update(deltaTime: number): void {
    if (this.isEmitting) {
      this.timeSinceLastEmit += deltaTime;
      while (this.timeSinceLastEmit >= this.emitInterval) {
        this.emitParticle();
        this.timeSinceLastEmit -= this.emitInterval;
      }
    }

    let allDead = true;
    for (const p of this.particles) {
      p.lifetime += deltaTime;
      if (p.lifetime < p.maxLifetime) {
        allDead = false;
        
        p.x += p.velocityX * deltaTime;
        p.y += p.velocityY * deltaTime;
        
        p.velocityX *= Math.pow(0.3, deltaTime);
        p.velocityY *= Math.pow(0.3, deltaTime);
        
        p.rotation += p.rotationSpeed * deltaTime;

        const progress = p.lifetime / p.maxLifetime;
        p.size = p.maxSize * Math.min(1, progress * 3);
      }
    }
    
    if (!this.isEmitting && allDead) {
      this.isDead = true;
    }
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

      const progress = p.lifetime / p.maxLifetime;
      const alpha = Math.max(0, 1 - progress) * 0.6;
      
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, pSize);
      gradient.addColorStop(0, `rgba(112, 123, 137, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(90, 95, 107, ${alpha * 0.7})`);
      gradient.addColorStop(1, `rgba(46, 46, 67, 0)`);
      
      ctx.fillStyle = gradient;
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
