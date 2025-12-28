import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../texture-sheets/ProjectileTextureSheet";

export class SniperProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.getTextureKey('sniper');
    textureSheet.drawShadow(ctx, key, centerX, centerY, this.size, angle);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.getTextureKey('sniper');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, this.size, angle);
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    particlesManager.spawnExplosion(this.x, this.y, 0.3);
  }
}
