import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { ProjectileImpactParticlesManager } from "../../ProjectileImpactParticlesManager";

export class MoagProjectile extends Projectile {
  public drawBody(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const radius = this.size * UNIT_TO_PIXEL;
    
    // Giant bomb (Dark grey/Black)
    ctx.fillStyle = "#2e2e43";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = "#4a4b5b";
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Fuse
    ctx.strokeStyle = "#e39764";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.quadraticCurveTo(centerX + radius * 0.5, centerY - radius * 1.5, centerX + radius, centerY - radius * 1.2);
    ctx.stroke();
    
    // Spark at end of fuse
    ctx.fillStyle = "#fceba8";
    ctx.beginPath();
    ctx.arc(centerX + radius, centerY - radius * 1.2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Outline
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    // MOAG should have a massive explosion
    const explosionRadius = this.explosionRadius ?? 4.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
