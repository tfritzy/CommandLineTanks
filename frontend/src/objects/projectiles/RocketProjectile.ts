import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { ProjectileImpactParticlesManager } from "../../ProjectileImpactParticlesManager";

export function drawRocketShadow(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, angle: number) {
  ctx.save();
  
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 3, radius * 1.2, 0, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, radius * 1.2);
  ctx.lineTo(0, -radius * 1.2);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

export function drawRocket(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, angle: number) {
  ctx.save();
  
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  
  // Flame
  const flameLength = radius * (2 + Math.random() * 2);
  ctx.fillStyle = "#f5c47c";
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.4);
  ctx.lineTo(-flameLength, 0);
  ctx.lineTo(0, radius * 0.4);
  ctx.fill();

  // Rocket (Green ovular body with flat back)
  ctx.fillStyle = "#4e9363";
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 3, radius * 1.2, 0, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, radius * 1.2);
  ctx.lineTo(0, -radius * 1.2);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

export class RocketProjectile extends Projectile {
  public drawShadow(ctx: CanvasRenderingContext2D) {
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const radius = this.size * UNIT_TO_PIXEL;
    const angle = Math.atan2(this.velocityY, this.velocityX);
    
    drawRocketShadow(ctx, centerX - 4, centerY + 4, radius, angle);
  }

  public drawBody(ctx: CanvasRenderingContext2D) {
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const radius = this.size * UNIT_TO_PIXEL;
    
    const angle = Math.atan2(this.velocityY, this.velocityX);
    
    drawRocket(ctx, centerX, centerY, radius, angle);
  }

  public isExplosive(): boolean {
    return true;
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    const explosionRadius = this.explosionRadius ?? 1.5;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
