import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";

export class MoagProjectile extends Projectile {
  public drawBody(ctx: CanvasRenderingContext2D, textureSheet?: ProjectileTextureSheet) {
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;

    if (textureSheet) {
      textureSheet.drawProjectile(ctx, 'moag', centerX, centerY);
    } else {
      const radius = this.size * UNIT_TO_PIXEL;

      ctx.save();
      
      ctx.fillStyle = "#2e2e43";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#4a4b5b";
      ctx.beginPath();
      ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "#e39764";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.quadraticCurveTo(centerX + radius * 0.5, centerY - radius * 1.5, centerX + radius, centerY - radius * 1.2);
      ctx.stroke();
      
      ctx.fillStyle = "#fceba8";
      ctx.beginPath();
      ctx.arc(centerX + radius, centerY - radius * 1.2, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
    }
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    const explosionRadius = this.explosionRadius ?? 4.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
