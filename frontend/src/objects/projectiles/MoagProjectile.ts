import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";

export class MoagProjectile extends Projectile {
  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const key = this.getTextureKey('moag');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, this.size);
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    const explosionRadius = this.explosionRadius ?? 4.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
