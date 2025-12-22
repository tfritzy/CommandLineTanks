import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";

export function drawMissileShadow(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, angle: number) {
  ctx.save();
  
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.moveTo(radius * 2, 0);
  ctx.lineTo(0, -radius * 0.8);
  ctx.lineTo(0, radius * 0.8);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

export function drawMissile(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, angle: number) {
  ctx.save();
  
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  
  const flameLength = radius * (1 + Math.random() * 1.5);
  ctx.fillStyle = "#f5c47c";
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.4);
  ctx.lineTo(-flameLength, 0);
  ctx.lineTo(0, radius * 0.4);
  ctx.fill();

  ctx.fillStyle = "#9d4343";
  ctx.beginPath();
  ctx.moveTo(radius * 2, 0);
  ctx.lineTo(0, -radius * 0.8);
  ctx.lineTo(0, radius * 0.8);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

export class MissileProjectile extends Projectile {
  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.alliance === 0 ? 'missile-red' : 'missile-blue';
    textureSheet.drawProjectile(ctx, key, centerX, centerY, 1.0, angle);
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    if (this.explosionRadius && this.explosionRadius > 0) {
      particlesManager.spawnExplosion(this.x, this.y, this.explosionRadius);
      return;
    }

    particlesManager.spawnExplosion(this.x, this.y, 0.5);
  }
}
