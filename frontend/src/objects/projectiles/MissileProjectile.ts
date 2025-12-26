import { Projectile } from "./Projectile";
import { ProjectileImpactParticlesManager } from "../../managers/ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "../../texture-sheets/ProjectileTextureSheet";
import { MISSILE_TRACKING_RADIUS } from "../../constants";
import type { TankManager } from "../../managers/TankManager";

export class MissileProjectile extends Projectile {
  public update(deltaTime: number, tankManager?: TankManager) {
    if (this.trackingStrength > 0 && tankManager) {
      const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
      
      let closestTarget = null;
      let closestDistanceSquared = MISSILE_TRACKING_RADIUS * MISSILE_TRACKING_RADIUS;
      
      for (const tank of tankManager.getAllTanks()) {
        const tankPos = tank.getPosition();
        const tankAlliance = tank.getAlliance();
        
        if (tankAlliance !== this.alliance && tank.getHealth() > 0) {
          const dx = tankPos.x - this.x;
          const dy = tankPos.y - this.y;
          const distanceSquared = dx * dx + dy * dy;
          
          if (distanceSquared < closestDistanceSquared) {
            closestDistanceSquared = distanceSquared;
            closestTarget = tankPos;
          }
        }
      }
      
      if (closestTarget) {
        const targetDx = closestTarget.x - this.x;
        const targetDy = closestTarget.y - this.y;
        const targetAngle = Math.atan2(targetDy, targetDx);
        
        const currentAngle = Math.atan2(this.velocityY, this.velocityX);
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.trackingStrength * deltaTime);
        const newAngle = currentAngle + turnAmount;
        
        this.velocityX = Math.cos(newAngle) * speed;
        this.velocityY = Math.sin(newAngle) * speed;
      }
    }
    
    super.update(deltaTime, tankManager);
  }

  public drawShadow(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.getTextureKey('missile');
    textureSheet.drawShadow(ctx, key, centerX, centerY, this.size, angle);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const key = this.getTextureKey('missile');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, this.size, angle);
  }

  public spawnDeathParticles(particlesManager: ProjectileImpactParticlesManager): void {
    if (this.explosionRadius && this.explosionRadius > 0) {
      particlesManager.spawnExplosion(this.x, this.y, this.explosionRadius);
      return;
    }

    particlesManager.spawnExplosion(this.x, this.y, 0.5);
  }
}
