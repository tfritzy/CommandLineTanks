import { UNIT_TO_PIXEL } from "../game";
import { TEAM_COLORS } from "../constants";
import { drawGrenade } from "../objects/projectiles/GrenadeProjectile";
import { drawMissile } from "../objects/projectiles/MissileProjectile";

export interface ProjectileTexture {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ProjectileTextureSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textures: Map<string, ProjectileTexture> = new Map();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 512;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error("Failed to get 2D context for projectile texture sheet");
    }
    this.ctx = ctx;
    
    this.initializeTextures();
  }

  private initializeTextures() {
    let currentX = 0;
    let currentY = 0;
    const padding = 2;
    const rowHeight = 50;

    const textureSize = 1.0;
    const radius = textureSize * UNIT_TO_PIXEL;

    this.addNormalProjectile('normal-red', TEAM_COLORS.RED, currentX, currentY, radius);
    currentX += radius * 2 + padding * 2;

    this.addNormalProjectile('normal-blue', TEAM_COLORS.BLUE, currentX, currentY, radius);
    currentX += radius * 4 + padding * 2;

    this.addBoomerangProjectile('boomerang-red', TEAM_COLORS.RED, currentX, currentY, radius);
    currentX += radius * 4 + padding * 2;

    this.addBoomerangProjectile('boomerang-blue', TEAM_COLORS.BLUE, currentX, currentY, radius);
    currentX = 0;
    currentY += rowHeight;

    this.addGrenadeProjectile('grenade', currentX, currentY, radius);
    currentX += radius * 2 + padding * 2;

    this.addMoagProjectile('moag', currentX, currentY, radius);
    currentX += radius * 3 + padding * 2;

    this.addRocketProjectile('rocket', currentX, currentY, radius);
    currentX = 0;
    currentY += rowHeight;

    this.addMissileProjectile('missile', currentX, currentY, radius * 1.5);
  }

  private addNormalProjectile(key: string, color: string, x: number, y: number, radius: number) {
    const centerX = x + radius + 2;
    const centerY = y + radius + 2;

    this.ctx.save();
    
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.restore();

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 2 + 4,
      height: radius * 2 + 4,
    });
  }

  private addBoomerangProjectile(key: string, color: string, x: number, y: number, radius: number) {
    const centerX = x + radius * 2 + 2;
    const centerY = y + radius * 2 + 2;

    this.ctx.save();
    
    this.ctx.translate(centerX, centerY);
    
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = "#2e2e43";
    this.ctx.lineWidth = 1.5;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, -radius * 2);
    this.ctx.lineTo(radius * 0.5, 0);
    this.ctx.lineTo(0, radius * 2);
    this.ctx.lineTo(-radius * 1.5, 0);
    this.ctx.closePath();
    
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.restore();

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 4 + 4,
      height: radius * 4 + 4,
    });
  }

  private addGrenadeProjectile(key: string, x: number, y: number, radius: number) {
    const centerX = x + radius + 2;
    const centerY = y + radius * 1.6 + 2;

    drawGrenade(this.ctx, centerX, centerY, radius);

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 2 + 4,
      height: radius * 2.2 + 4,
    });
  }

  private addMoagProjectile(key: string, x: number, y: number, radius: number) {
    const centerX = x + radius + 2;
    const centerY = y + radius + 2;

    this.ctx.save();
    
    this.ctx.fillStyle = "#2e2e43";
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = "#4a4b5b";
    this.ctx.beginPath();
    this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = "#e39764";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - radius);
    this.ctx.quadraticCurveTo(centerX + radius * 0.5, centerY - radius * 1.5, centerX + radius, centerY - radius * 1.2);
    this.ctx.stroke();
    
    this.ctx.fillStyle = "#fceba8";
    this.ctx.beginPath();
    this.ctx.arc(centerX + radius, centerY - radius * 1.2, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 2 + 4,
      height: radius * 2 + 4,
    });
  }

  private addMissileProjectile(key: string, x: number, y: number, radius: number) {
    const centerX = x + radius * 2 + 2;
    const centerY = y + radius + 2;

    drawMissile(this.ctx, centerX, centerY, radius, 0);

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 4 + 4,
      height: radius * 2 + 4,
    });
  }

  private addRocketProjectile(key: string, x: number, y: number, radius: number) {
    const centerX = x + radius * 3 + 2;
    const centerY = y + radius * 1.2 + 2;

    this.ctx.save();
    
    this.ctx.translate(centerX, centerY);
    
    this.ctx.fillStyle = "#4e9363";
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, radius * 3, radius * 1.2, 0, -Math.PI / 2, Math.PI / 2);
    this.ctx.lineTo(0, radius * 1.2);
    this.ctx.lineTo(0, -radius * 1.2);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 6 + 4,
      height: radius * 2.4 + 4,
    });
  }

  public getTexture(key: string): ProjectileTexture | undefined {
    return this.textures.get(key);
  }

  public drawProjectile(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0,
    rotation: number = 0
  ) {
    const texture = this.textures.get(key);
    if (!texture) return;

    ctx.save();

    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    if (scale !== 1.0) {
      ctx.scale(scale, scale);
    }

    ctx.drawImage(
      this.canvas,
      texture.x,
      texture.y,
      texture.width,
      texture.height,
      -texture.width / 2,
      -texture.height / 2,
      texture.width,
      texture.height
    );

    ctx.restore();
  }
}
