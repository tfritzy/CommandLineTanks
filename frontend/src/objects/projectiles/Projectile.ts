import { UNIT_TO_PIXEL } from "../../constants";

export abstract class Projectile {
  public static readonly SHADOW_OFFSET = 4;
  protected x: number;
  protected y: number;
  protected previousX: number;
  protected previousY: number;
  protected velocityX: number;
  protected velocityY: number;
  protected size: number;
  protected alliance: number;
  protected explosionRadius: number | undefined;
  protected trackingStrength: number;
  protected trackingRadius: number;
  protected lastUpdateTime: number;
  private cachedInterpolatedPos: { x: number; y: number } | null = null;
  private cachedTime: number = 0;

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
    this.previousX = x;
    this.previousY = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = size;
    this.alliance = alliance;
    this.explosionRadius = explosionRadius;
    this.trackingStrength = trackingStrength || 0;
    this.trackingRadius = trackingRadius || 0;
    this.lastUpdateTime = performance.now() / 1000;
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
    this.previousX = this.x;
    this.previousY = this.y;
    this.x = x;
    this.y = y;
    this.lastUpdateTime = performance.now() / 1000;
  }

  public setVelocity(velocityX: number, velocityY: number) {
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  public update(_deltaTime: number, _tankManager?: { getAllTanks(): IterableIterator<{ getPosition(): { x: number; y: number }; getAlliance(): number; getHealth(): number }> }) {
    this.cachedInterpolatedPos = null;
  }

  private getInterpolatedPosition(): { x: number; y: number } {
    const currentTime = performance.now() / 1000;
    
    if (this.cachedInterpolatedPos && this.cachedTime === currentTime) {
      return this.cachedInterpolatedPos;
    }
    
    const timeSinceLastUpdate = currentTime - this.lastUpdateTime;
    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    const expectedTravelTime = speed > 0 ? Math.sqrt(
      Math.pow(this.x - this.previousX, 2) + Math.pow(this.y - this.previousY, 2)
    ) / speed : 0;
    
    if (expectedTravelTime === 0) {
      this.cachedInterpolatedPos = { x: this.x, y: this.y };
      this.cachedTime = currentTime;
      return this.cachedInterpolatedPos;
    }
    
    const t = Math.min(1, timeSinceLastUpdate / expectedTravelTime);
    
    this.cachedInterpolatedPos = {
      x: this.previousX + (this.x - this.previousX) * t,
      y: this.previousY + (this.y - this.previousY) * t
    };
    this.cachedTime = currentTime;
    return this.cachedInterpolatedPos;
  }

  public getX(): number {
    return this.getInterpolatedPosition().x;
  }

  public getY(): number {
    return this.getInterpolatedPosition().y;
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
    const pos = this.getInterpolatedPosition();
    return {
      x: pos.x * UNIT_TO_PIXEL,
      y: pos.y * UNIT_TO_PIXEL,
    };
  }

  protected getShadowScreenPosition(): { x: number; y: number } {
    const pos = this.getInterpolatedPosition();
    return {
      x: pos.x * UNIT_TO_PIXEL - Projectile.SHADOW_OFFSET,
      y: pos.y * UNIT_TO_PIXEL + Projectile.SHADOW_OFFSET,
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
