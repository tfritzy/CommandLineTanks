import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";
import { TEAM_COLORS } from "../../constants";

export class NormalProjectile extends Projectile {
  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const key = this.alliance === 0 ? 'normal-red' : 'normal-blue';
    textureSheet.drawProjectile(ctx, key, centerX, centerY);
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
