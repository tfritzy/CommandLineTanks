import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";

export function drawGrenadeShadow(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGrenade(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  ctx.save();
  
  const bodyColor = "#4e9363";
  const shadowColor = "#3c6c54";
  const highlightColor = "#6ec077";
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
  ctx.clip();
  
  ctx.fillStyle = bodyColor;
  ctx.fill();
  
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.2, centerY + radius * 0.2, radius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.arc(centerX + radius * 0.2, centerY - radius * 0.2, radius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  ctx.save();
  ctx.strokeStyle = "#2e2e43";
  ctx.lineWidth = Math.max(1, radius * 0.15);
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.stroke();
  
  const pinWidth = radius * 0.3;
  const pinHeight = radius * 0.4;
  const pinY = centerY - radius * 1.1;
  
  ctx.fillStyle = "#2e2e43";
  ctx.fillRect(centerX - pinWidth / 2, pinY - pinHeight, pinWidth, pinHeight);
  
  ctx.fillStyle = "#707b89";
  const ringRadius = radius * 0.25;
  ctx.beginPath();
  ctx.arc(centerX + pinWidth / 2, pinY - pinHeight / 2, ringRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = "#2e2e43";
  ctx.lineWidth = Math.max(0.5, radius * 0.1);
  ctx.beginPath();
  ctx.arc(centerX + pinWidth / 2, pinY - pinHeight / 2, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

export class GrenadeProjectile extends Projectile {
  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    textureSheet.drawProjectile(ctx, 'grenade', centerX, centerY);
  }

  public isExplosive(): boolean {
    return true;
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    const explosionRadius = this.explosionRadius ?? 2.0;
    particlesManager.spawnExplosion(this.x, this.y, explosionRadius);
  }
}
