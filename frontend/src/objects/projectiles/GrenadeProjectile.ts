import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../texture-sheets/ProjectileTextureSheet";

export class GrenadeProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const key = this.getTextureKey('grenade');
    textureSheet.drawShadow(ctx, key, centerX, centerY, this.size);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const key = this.getTextureKey('grenade');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, this.size);
  }

  public isExplosive(): boolean {
    return true;
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    const explosionRadius = this.explosionRadius ?? 2.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
