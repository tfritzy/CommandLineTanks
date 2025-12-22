import { UNIT_TO_PIXEL } from "../../game";

export abstract class Projectile {
  protected x: number;
  protected y: number;
  protected velocityX: number;
  protected velocityY: number;
  protected size: number;
  protected alliance: number;
  protected explosionRadius: number | undefined;

  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    size: number,
    alliance: number,
    explosionRadius?: number
  ) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = size;
    this.alliance = alliance;
    this.explosionRadius = explosionRadius;
  }

  public draw(ctx: CanvasRenderingContext2D, textureSheet: any) {
    this.drawShadow(ctx, textureSheet);
    this.drawBody(ctx, textureSheet);
  }

  public drawShadow(ctx: CanvasRenderingContext2D, textureSheet: any) {}

  public abstract drawBody(ctx: CanvasRenderingContext2D, textureSheet: any): void;

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public setVelocity(velocityX: number, velocityY: number) {
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  public update(deltaTime: number) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
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
      y: this.y * UNIT_TO_PIXEL
    };
  }

  protected getShadowScreenPosition(): { x: number; y: number } {
    return {
      x: this.x * UNIT_TO_PIXEL - 4,
      y: this.y * UNIT_TO_PIXEL + 4
    };
  }

  protected getTextureKey(prefix: string): string {
    return `${prefix}-${this.alliance === 0 ? 'red' : 'blue'}`;
  }

  public isExplosive(): boolean {
    return false;
  }

  public spawnDeathParticles(_particlesManager: any): void {
    // Default implementation - override in subclasses for custom behavior
  }
}
