import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../texture-sheets/ProjectileTextureSheet";
import { TEAM_COLORS } from "../../constants";

export class SniperProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const key = this.getTextureKey('sniper');
    textureSheet.drawShadow(ctx, key, centerX, centerY, this.size);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const key = this.getTextureKey('sniper');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, this.size);
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    const color = this.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
    particlesManager.spawnParticles(
      this.x,
      this.y,
      this.velocityX,
      this.velocityY,
      color
    );
  }
}
