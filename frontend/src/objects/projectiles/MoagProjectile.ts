import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import type { ProjectileSvgSheet } from "../../svg/projectiles";

export class MoagProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D, textureSheet: ProjectileSvgSheet) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const key = this.getTextureKey('moag');
    textureSheet.drawShadow(ctx, key, centerX, centerY, this.size);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileSvgSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const key = this.getTextureKey('moag');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, this.size);
  }

  public spawnDeathParticles(
    particlesManager: ProjectileImpactParticlesManager
  ): void {
    const explosionRadius = this.explosionRadius ?? 4.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
