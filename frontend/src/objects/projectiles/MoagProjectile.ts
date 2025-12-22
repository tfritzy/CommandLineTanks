import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";
import { UNIT_TO_PIXEL } from "../../game";

export class MoagProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D, _textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const radius = this.size * UNIT_TO_PIXEL;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const radius = this.size * UNIT_TO_PIXEL;
    const angle = Math.atan2(this.velocityY, this.velocityX);

    const lineLength = 1000;
    const lineOffset = radius * 0.8;

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    ctx.save();

    ctx.strokeStyle = this.alliance === 0 ? "#c06852" : "#5a78b2";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.globalAlpha = 0.6;

    ctx.beginPath();
    ctx.moveTo(centerX + perpX * lineOffset, centerY + perpY * lineOffset);
    ctx.lineTo(
      centerX + perpX * lineOffset + dirX * lineLength,
      centerY + perpY * lineOffset + dirY * lineLength
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - perpX * lineOffset, centerY - perpY * lineOffset);
    ctx.lineTo(
      centerX - perpX * lineOffset + dirX * lineLength,
      centerY - perpY * lineOffset + dirY * lineLength
    );
    ctx.stroke();

    ctx.restore();

    ctx.save();
    const key = this.getTextureKey('moag');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, 1.0);
    ctx.restore();
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    const explosionRadius = this.explosionRadius ?? 4.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
