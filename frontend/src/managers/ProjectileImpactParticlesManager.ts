import { ProjectileImpactParticles } from "../objects/particles/ProjectileImpactParticles";
import { ExplosionParticles } from "../objects/particles/ExplosionParticles";
import { UNIT_TO_PIXEL } from "../constants";

const TWO_PI = Math.PI * 2;
const VIEWPORT_PADDING = 100;

export class ProjectileImpactParticlesManager {
  private impactSystems: ProjectileImpactParticles[] = [];
  private explosionSystems: ExplosionParticles[] = [];

  public spawnParticles(x: number, y: number, velocityX: number, velocityY: number, color: string): void {
    const particles = new ProjectileImpactParticles(x, y, velocityX, velocityY, color);
    this.impactSystems.push(particles);
  }

  public spawnExplosion(x: number, y: number, explosionRadius: number): void {
    const particles = new ExplosionParticles(x, y, explosionRadius);
    this.explosionSystems.push(particles);
  }

  public update(deltaTime: number): void {
    let writeIndex = 0;
    for (let i = 0; i < this.impactSystems.length; i++) {
      this.impactSystems[i].update(deltaTime);
      if (!this.impactSystems[i].getIsDead()) {
        if (writeIndex !== i) {
          this.impactSystems[writeIndex] = this.impactSystems[i];
        }
        writeIndex++;
      }
    }
    this.impactSystems.length = writeIndex;

    writeIndex = 0;
    for (let i = 0; i < this.explosionSystems.length; i++) {
      this.explosionSystems[i].update(deltaTime);
      if (!this.explosionSystems[i].getIsDead()) {
        if (writeIndex !== i) {
          this.explosionSystems[writeIndex] = this.explosionSystems[i];
        }
        writeIndex++;
      }
    }
    this.explosionSystems.length = writeIndex;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    const paddedLeft = cameraX - VIEWPORT_PADDING;
    const paddedRight = cameraX + viewportWidth + VIEWPORT_PADDING;
    const paddedTop = cameraY - VIEWPORT_PADDING;
    const paddedBottom = cameraY + viewportHeight + VIEWPORT_PADDING;

    for (const system of this.impactSystems) {
      const color = system.getColor();
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        if (px + pSize < paddedLeft || px - pSize > paddedRight || 
            py + pSize < paddedTop || py - pSize > paddedBottom) continue;

        const alpha = 1 - p.lifetime / p.maxLifetime;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, TWO_PI);
        ctx.fill();
      }
    }

    for (const system of this.explosionSystems) {
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#FF00FF";
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, TWO_PI);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  public destroy(): void {
    this.impactSystems.length = 0;
    this.explosionSystems.length = 0;
  }
}
