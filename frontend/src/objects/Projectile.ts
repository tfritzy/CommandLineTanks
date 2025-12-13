import { UNIT_TO_PIXEL } from "../game";

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
    ctx.save();
    
    const centerX = this.x * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2;
    const centerY = this.y * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2;
    const radius = this.size * UNIT_TO_PIXEL;
    
    ctx.fillStyle = this.alliance === 0 ? '#ff0000' : '#0000ff';
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
}
