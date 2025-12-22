import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";

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
  
  const flameLength = radius * (2 + Math.random() * 2);
  ctx.fillStyle = "#f5c47c";
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.4);
  ctx.lineTo(-flameLength, 0);
  ctx.lineTo(0, radius * 0.4);
  ctx.fill();

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
