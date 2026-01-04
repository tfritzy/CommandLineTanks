import { UNIT_TO_PIXEL } from "../../constants";
import { isPointInViewport } from "../../utils/viewport";
import type { Particle } from "./ParticleTypes";
import { COLORS } from "../../theme/colors";

export class TerrainDebrisParticles {
  private particles: Particle[] = [];
  private isDead = false;
  private x: number;
  private y: number;
  private cachedPosition: { x: number; y: number };

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.cachedPosition = { x, y };
    const fenceColors = [COLORS.TERMINAL.TEXT_MUTED, COLORS.TERMINAL.TEXT_DIM, COLORS.TERMINAL.SEPARATOR];
    
    const particleCount = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      
      this.particles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: 0.03 + Math.random() * 0.04,
        lifetime: 0,
        maxLifetime: 0.3 + Math.random() * 0.3,
        color: fenceColors[Math.floor(Math.random() * fenceColors.length)]
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
        p.velocityY += 3 * deltaTime;
        p.velocityX *= 0.97;
        p.velocityY *= 0.97;
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

  public getPosition(): { x: number; y: number } {
    this.cachedPosition.x = this.x;
    this.cachedPosition.y = this.y;
    return this.cachedPosition;
  }
}
