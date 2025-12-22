import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { TEAM_COLORS } from "../../constants";
import { ProjectileImpactParticlesManager } from "../../ProjectileImpactParticlesManager";

export class NormalProjectile extends Projectile {
  public drawBody(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const radius = this.size * UNIT_TO_PIXEL;
    
    ctx.fillStyle = this.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
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
