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

  public draw(ctx: CanvasRenderingContext2D) {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public drawShadow(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const radius = this.size * UNIT_TO_PIXEL;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY + 4, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  public abstract drawBody(ctx: CanvasRenderingContext2D): void;

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

  public isExplosive(): boolean {
    return false;
  }

  public spawnDeathParticles(_particlesManager: any): void {
    // Default implementation - override in subclasses for custom behavior
  }
}
