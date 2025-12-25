import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../texture-sheets/ProjectileTextureSheet";

export class RocketProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.getTextureKey('rocket');
    textureSheet.drawShadow(ctx, key, centerX, centerY, this.size, angle);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.getTextureKey('rocket');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, this.size, angle);
  }

  public isExplosive(): boolean {
    return true;
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    const explosionRadius = this.explosionRadius ?? 1.5;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
