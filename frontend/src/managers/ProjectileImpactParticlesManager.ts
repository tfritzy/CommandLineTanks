import { ProjectileImpactParticles } from "../objects/particles/ProjectileImpactParticles";
import { ExplosionParticles } from "../objects/particles/ExplosionParticles";
import { UNIT_TO_PIXEL } from "../constants";
import { COLORS } from "../theme/colors";

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

    if (this.impactSystems.length > 0) {
      ctx.save();
      
      ctx.fillStyle = COLORS.GAME.TEAM_RED_BRIGHT;
      ctx.beginPath();
      for (const system of this.impactSystems) {
        if (system.getColor() !== COLORS.GAME.TEAM_RED_BRIGHT) continue;
        for (const p of system.getParticles()) {
          if (p.lifetime >= p.maxLifetime) continue;
          const px = p.x * UNIT_TO_PIXEL;
          const py = p.y * UNIT_TO_PIXEL;
          const pSize = p.size * UNIT_TO_PIXEL;
          if (px + pSize < paddedLeft || px - pSize > paddedRight || 
              py + pSize < paddedTop || py - pSize > paddedBottom) continue;
          ctx.moveTo(px + pSize, py);
          ctx.arc(px, py, pSize, 0, TWO_PI);
        }
      }
      ctx.fill();

      ctx.fillStyle = COLORS.GAME.TEAM_BLUE_BRIGHT;
      ctx.beginPath();
      for (const system of this.impactSystems) {
        if (system.getColor() !== COLORS.GAME.TEAM_BLUE_BRIGHT) continue;
        for (const p of system.getParticles()) {
          if (p.lifetime >= p.maxLifetime) continue;
          const px = p.x * UNIT_TO_PIXEL;
          const py = p.y * UNIT_TO_PIXEL;
          const pSize = p.size * UNIT_TO_PIXEL;
          if (px + pSize < paddedLeft || px - pSize > paddedRight || 
              py + pSize < paddedTop || py - pSize > paddedBottom) continue;
          ctx.moveTo(px + pSize, py);
          ctx.arc(px, py, pSize, 0, TWO_PI);
        }
      }
      ctx.fill();

      ctx.restore();
    }

    this.drawExplosions(ctx, paddedLeft, paddedRight, paddedTop, paddedBottom);
  }

  private drawExplosions(ctx: CanvasRenderingContext2D, paddedLeft: number, paddedRight: number, paddedTop: number, paddedBottom: number): void {
    if (this.explosionSystems.length === 0) return;

    ctx.save();

    ctx.fillStyle = COLORS.EFFECTS.FIRE_BRIGHT;
    ctx.beginPath();
    for (const system of this.explosionSystems) {
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        if (p.color !== COLORS.EFFECTS.FIRE_BRIGHT) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        if (px + pSize < paddedLeft || px - pSize > paddedRight || 
            py + pSize < paddedTop || py - pSize > paddedBottom) continue;
        ctx.moveTo(px + pSize, py);
        ctx.arc(px, py, pSize, 0, TWO_PI);
      }
    }
    ctx.fill();

    ctx.fillStyle = COLORS.EFFECTS.FIRE_YELLOW;
    ctx.beginPath();
    for (const system of this.explosionSystems) {
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        if (p.color !== COLORS.EFFECTS.FIRE_YELLOW) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        if (px + pSize < paddedLeft || px - pSize > paddedRight || 
            py + pSize < paddedTop || py - pSize > paddedBottom) continue;
        ctx.moveTo(px + pSize, py);
        ctx.arc(px, py, pSize, 0, TWO_PI);
      }
    }
    ctx.fill();

    ctx.fillStyle = COLORS.EFFECTS.FIRE_ORANGE;
    ctx.beginPath();
    for (const system of this.explosionSystems) {
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        if (p.color !== COLORS.EFFECTS.FIRE_ORANGE) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        if (px + pSize < paddedLeft || px - pSize > paddedRight || 
            py + pSize < paddedTop || py - pSize > paddedBottom) continue;
        ctx.moveTo(px + pSize, py);
        ctx.arc(px, py, pSize, 0, TWO_PI);
      }
    }
    ctx.fill();

    ctx.restore();
  }

  public destroy(): void {
    this.impactSystems.length = 0;
    this.explosionSystems.length = 0;
  }
}
