import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import type { ProjectileTextureCache } from "../../textures/ProjectileTextureCache";

export class MissileProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D, textureCache: ProjectileTextureCache) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.getTextureKey('missile');
    textureCache.drawShadow(ctx, key, centerX, centerY, this.size, angle);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureCache: ProjectileTextureCache) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.getTextureKey('missile');
    textureCache.drawProjectile(ctx, key, centerX, centerY, this.size, angle);
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    if (this.explosionRadius && this.explosionRadius > 0) {
      particlesManager.spawnExplosion(this.x, this.y, this.explosionRadius);
      return;
    }

    particlesManager.spawnExplosion(this.x, this.y, 0.5);
  }
}
