import { UNIT_TO_PIXEL } from "../../constants";

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
    this.x = x;
    this.y = y;
  }

  public setVelocity(velocityX: number, velocityY: number) {
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  public update(deltaTime: number, _tankManager?: { getAllTanks(): IterableIterator<{ getPosition(): { x: number; y: number }; getAlliance(): number; getHealth(): number }> }) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
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
    return `${prefix}-${this.alliance}`;
  }

  public isExplosive(): boolean {
    return false;
  }

  public spawnDeathParticles(_particlesManager: any): void {
    // Default implementation - override in subclasses for custom behavior
  }
}
