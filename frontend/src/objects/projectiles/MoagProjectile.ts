import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import type { ProjectileTextureCache } from "../../textures/ProjectileTextureCache";
import { drawMoagShadow, drawMoagBody } from "../../drawing";

export class MoagProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D, _textureCache: ProjectileTextureCache) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    drawMoagShadow(ctx, centerX, centerY, this.size);
  }

  public drawBody(ctx: CanvasRenderingContext2D, _textureCache: ProjectileTextureCache) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    drawMoagBody(ctx, centerX, centerY, this.size, this.alliance);
  }

  public spawnDeathParticles(
    particlesManager: ProjectileImpactParticlesManager
  ): void {
    const explosionRadius = this.explosionRadius ?? 4.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
