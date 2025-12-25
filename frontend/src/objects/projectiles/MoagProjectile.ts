import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../texture-sheets/ProjectileTextureSheet";
import { TEAM_COLORS } from "../../constants";
import { UNIT_TO_PIXEL } from "../../game";

export class MoagProjectile extends Projectile {
  public drawShadow(
    ctx: CanvasRenderingContext2D,
    _textureSheet: ProjectileTextureSheet
  ) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const radius = this.size * UNIT_TO_PIXEL;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawBody(
    ctx: CanvasRenderingContext2D,
    _textureSheet: ProjectileTextureSheet
  ) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const radius = this.size * UNIT_TO_PIXEL;
    const color = this.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  public spawnDeathParticles(
    particlesManager: ProjectileImpactParticlesManager
  ): void {
    const explosionRadius = this.explosionRadius ?? 4.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
