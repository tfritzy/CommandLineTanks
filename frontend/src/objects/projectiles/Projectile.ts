import { UNIT_TO_PIXEL } from "../../constants";

const INTERPOLATION_DELAY = 100;
const BUFFER_DURATION = 200;

export abstract class Projectile {
  public static readonly SHADOW_OFFSET = 4;
  protected x: number;
  protected y: number;
  protected velocityX: number;
  protected velocityY: number;
  protected size: number;
  protected alliance: number;
  protected explosionRadius: number | undefined;
  protected trackingStrength: number;
  protected trackingRadius: number;
  private positionBuffer: Array<{ x: number; y: number; timestamp: number }> = [];

  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    size: number,
    alliance: number,
    explosionRadius?: number,
    trackingStrength?: number,
    trackingRadius?: number
  ) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = size;
    this.alliance = alliance;
    this.explosionRadius = explosionRadius;
    this.trackingStrength = trackingStrength || 0;
    this.trackingRadius = trackingRadius || 0;
  }

  public draw(ctx: CanvasRenderingContext2D, textureSheet: any) {
    this.drawShadow(ctx, textureSheet);
    this.drawBody(ctx, textureSheet);
  }

  public drawShadow(_ctx: CanvasRenderingContext2D, _textureSheet: any) {}

  public abstract drawBody(
    ctx: CanvasRenderingContext2D,
    textureSheet: any
  ): void;

  public setPosition(x: number, y: number) {
    this.positionBuffer.push({
      x,
      y,
      timestamp: performance.now()
    });

    const cutoffTime = performance.now() - BUFFER_DURATION;
    this.positionBuffer = this.positionBuffer.filter(p => p.timestamp > cutoffTime);

    if (this.positionBuffer.length === 1) {
      this.x = x;
      this.y = y;
    }
  }

  public setVelocity(velocityX: number, velocityY: number) {
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  public update(deltaTime: number, tankManager?: { getAllTanks(): IterableIterator<{ getPosition(): { x: number; y: number }; getAlliance(): number; getHealth(): number }> }) {
    if (this.positionBuffer.length >= 2) {
      const renderTime = performance.now() - INTERPOLATION_DELAY;

      let prev = this.positionBuffer[0];
      let next = this.positionBuffer[1];

      for (let i = 0; i < this.positionBuffer.length - 1; i++) {
        if (this.positionBuffer[i + 1].timestamp > renderTime) {
          prev = this.positionBuffer[i];
          next = this.positionBuffer[i + 1];
          break;
        }
      }

      const total = next.timestamp - prev.timestamp;
      const elapsed = renderTime - prev.timestamp;
      const t = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 1;

      this.x = prev.x + (next.x - prev.x) * t;
      this.y = prev.y + (next.y - prev.y) * t;
    }

    if (this.trackingStrength > 0 && this.trackingRadius > 0 && tankManager) {
      const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
      
      let closestTarget = null;
      let closestDistanceSquared = this.trackingRadius * this.trackingRadius;
      
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
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getVelocityX(): number {
    return this.velocityX;
  }

  public getVelocityY(): number {
    return this.velocityY;
  }

  public getAlliance(): number {
    return this.alliance;
  }

  public getSize(): number {
    return this.size;
  }

  public getExplosionRadius(): number | undefined {
    return this.explosionRadius;
  }

  protected getScreenPosition(): { x: number; y: number } {
    return {
      x: this.x * UNIT_TO_PIXEL,
      y: this.y * UNIT_TO_PIXEL,
    };
  }

  protected getShadowScreenPosition(): { x: number; y: number } {
    return {
      x: this.x * UNIT_TO_PIXEL - Projectile.SHADOW_OFFSET,
      y: this.y * UNIT_TO_PIXEL + Projectile.SHADOW_OFFSET,
    };
  }

  protected getTextureKey(prefix: string): string {
    return `${prefix}-${this.alliance === 0 ? "red" : "blue"}`;
  }

  public isExplosive(): boolean {
    return false;
  }

  public spawnDeathParticles(_particlesManager: any): void {
    // Default implementation - override in subclasses for custom behavior
  }
}
