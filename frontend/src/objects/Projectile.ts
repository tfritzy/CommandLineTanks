import { UNIT_TO_PIXEL } from "../game";
import { type Infer } from "spacetimedb";
import { ProjectileType } from "../../module_bindings";

export class Projectile {
  private x: number;
  private y: number;
  private velocityX: number;
  private velocityY: number;
  private size: number;
  private alliance: number;
  private projectileType: Infer<typeof ProjectileType>;

  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    size: number,
    alliance: number,
    projectileType: Infer<typeof ProjectileType>
  ) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = size;
    this.alliance = alliance;
    this.projectileType = projectileType;
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
    
    const angle = Math.atan2(this.velocityY, this.velocityX);
    
    switch (this.projectileType.tag) {
      case "Missile":
        this.drawMissile(ctx, centerX, centerY, radius, angle);
        break;
      case "Rocket":
        this.drawRocket(ctx, centerX, centerY, radius, angle);
        break;
      case "Grenade":
        this.drawGrenade(ctx, centerX, centerY, radius);
        break;
      case "Boomerang":
        this.drawBoomerang(ctx, centerX, centerY, radius, angle);
        break;
      case "Moag":
        this.drawMoag(ctx, centerX, centerY, radius);
        break;
      default:
        this.drawNormal(ctx, centerX, centerY, radius);
        break;
    }
    
    ctx.restore();
  }

  private drawNormal(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    ctx.fillStyle = this.alliance === 0 ? '#ff0000' : '#0000ff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawMissile(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, angle: number) {
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    
    const length = radius * 3;
    const width = radius * 1.5;
    
    ctx.fillStyle = this.alliance === 0 ? '#cc0000' : '#0000cc';
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(-length * 0.3, -width / 2);
    ctx.lineTo(-length, -width / 3);
    ctx.lineTo(-length, width / 3);
    ctx.lineTo(-length * 0.3, width / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.moveTo(-length * 0.3, -width / 2);
    ctx.lineTo(-length, -width / 1.5);
    ctx.lineTo(-length, -width / 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-length * 0.3, width / 2);
    ctx.lineTo(-length, width / 1.5);
    ctx.lineTo(-length, width / 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = this.alliance === 0 ? '#ff3333' : '#3333ff';
    ctx.fillRect(length * 0.2, -width * 0.25, length * 0.4, width * 0.5);
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private drawRocket(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, angle: number) {
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    
    const length = radius * 3.5;
    const width = radius * 1.2;
    
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(-length * 0.2, -width / 2);
    ctx.lineTo(-length * 0.8, -width / 2);
    ctx.lineTo(-length, -width / 3);
    ctx.lineTo(-length, width / 3);
    ctx.lineTo(-length * 0.8, width / 2);
    ctx.lineTo(-length * 0.2, width / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#222222';
    ctx.fillRect(length * 0.3, -width * 0.3, length * 0.3, width * 0.6);
    
    const exhaustLength = radius * 2;
    const gradient = ctx.createLinearGradient(-length, 0, -length - exhaustLength, 0);
    gradient.addColorStop(0, 'rgba(255, 150, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-length, -width / 3);
    ctx.lineTo(-length - exhaustLength, 0);
    ctx.lineTo(-length, width / 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private drawGrenade(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    ctx.fillStyle = '#2a5a2a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const pinHeight = radius * 1.5;
    ctx.fillStyle = '#888888';
    ctx.fillRect(centerX - radius * 0.2, centerY - radius - pinHeight, radius * 0.4, pinHeight);
    
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(centerX, centerY - radius - pinHeight, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#1a3a1a';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius * 0.7;
      const y = centerY + Math.sin(angle) * radius * 0.7;
      ctx.fillRect(x - 1, y - 1, 2, 4);
    }
  }

  private drawBoomerang(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, angle: number) {
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + (Date.now() / 100));
    
    const length = radius * 3;
    const width = radius * 0.8;
    
    ctx.fillStyle = '#8b4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.5, -length * 0.3, length, -length * 0.2);
    ctx.lineTo(length * 0.9, -length * 0.2 + width);
    ctx.quadraticCurveTo(length * 0.4, -length * 0.25, 0, width);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.3, length * 0.5, length * 0.2, length);
    ctx.lineTo(length * 0.2 + width, length * 0.9);
    ctx.quadraticCurveTo(length * 0.25, length * 0.4, width, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private drawMoag(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(0.5, '#9400d3');
    gradient.addColorStop(1, '#4b0082');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const time = Date.now() / 200;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time;
      const x1 = centerX + Math.cos(angle) * radius * 0.3;
      const y1 = centerY + Math.sin(angle) * radius * 0.3;
      const x2 = centerX + Math.cos(angle) * radius * 0.8;
      const y2 = centerY + Math.sin(angle) * radius * 0.8;
      
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
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
