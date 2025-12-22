import { UNIT_TO_PIXEL } from "../game";
import { TEAM_COLORS } from "../constants";

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

  public drawBody(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const radius = this.size * UNIT_TO_PIXEL;
    
    ctx.fillStyle = this.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
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
