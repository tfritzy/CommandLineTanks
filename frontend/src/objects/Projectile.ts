import { UNIT_TO_PIXEL } from "../game";
import { drawProjectileShadow, drawProjectileBody } from "../drawing/projectiles/projectile";

export class Projectile {
  private x: number;
  private y: number;
  private velocityX: number;
  private velocityY: number;
  private size: number;
  private alliance: number;

  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    size: number,
    alliance: number
  ) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = size;
    this.alliance = alliance;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public drawShadow(ctx: CanvasRenderingContext2D) {
    drawProjectileShadow(ctx, this.x, this.y, this.size);
  }

  public drawBody(ctx: CanvasRenderingContext2D) {
    drawProjectileBody(ctx, this.x, this.y, this.size, this.alliance);
  }

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
}
