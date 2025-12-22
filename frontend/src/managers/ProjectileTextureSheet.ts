import { UNIT_TO_PIXEL } from "../game";
import { TEAM_COLORS } from "../constants";

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
    this.canvas.width = 1024;
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
    const padding = 4;
    const rowHeight = 80;

    const textureSize = 1.0;
    const radius = textureSize * UNIT_TO_PIXEL;

    this.addNormalProjectile('normal-red', TEAM_COLORS.RED, currentX, currentY, radius);
    currentX += radius * 2 + padding * 3 + 8;

    this.addNormalProjectile('normal-blue', TEAM_COLORS.BLUE, currentX, currentY, radius);
    currentX += radius * 2 + padding * 3 + 8;

    this.addBoomerangProjectile('boomerang-red', TEAM_COLORS.RED, currentX, currentY, radius);
    currentX += radius * 4 + padding * 3 + 8;

    this.addBoomerangProjectile('boomerang-blue', TEAM_COLORS.BLUE, currentX, currentY, radius);
    currentX = 0;
    currentY += rowHeight;

    this.addGrenadeProjectile('grenade-red', TEAM_COLORS.RED, currentX, currentY, radius);
    currentX += radius * 2 + padding * 3 + 8;

    this.addGrenadeProjectile('grenade-blue', TEAM_COLORS.BLUE, currentX, currentY, radius);
    currentX += radius * 2 + padding * 3 + 8;

    this.addMoagProjectile('moag-red', TEAM_COLORS.RED, currentX, currentY, radius);
    currentX += radius * 2 + padding * 3 + 8;

    this.addMoagProjectile('moag-blue', TEAM_COLORS.BLUE, currentX, currentY, radius);
    currentX = 0;
    currentY += rowHeight;

    this.addRocketProjectile('rocket-red', TEAM_COLORS.RED, currentX, currentY, radius);
    currentX += radius * 6 + padding * 3 + 8;

    this.addRocketProjectile('rocket-blue', TEAM_COLORS.BLUE, currentX, currentY, radius);
    currentX = 0;
    currentY += rowHeight;

    this.addMissileProjectile('missile-red', TEAM_COLORS.RED, currentX, currentY, radius * 1.5);
    currentX += radius * 4 + padding * 3 + 8;

    this.addMissileProjectile('missile-blue', TEAM_COLORS.BLUE, currentX, currentY, radius * 1.5);
  }

  private addNormalProjectile(key: string, color: string, x: number, y: number, radius: number) {
    const shadowOffsetX = 4;
    const shadowOffsetY = 4;
    const centerX = x + radius + shadowOffsetX + 2;
    const centerY = y + radius + shadowOffsetY + 2;

    this.ctx.save();
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(centerX - shadowOffsetX, centerY - shadowOffsetY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.restore();

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 2 + shadowOffsetX + 4,
      height: radius * 2 + shadowOffsetY + 4,
    });
  }

  private addBoomerangProjectile(key: string, color: string, x: number, y: number, radius: number) {
    const shadowOffsetX = 4;
    const shadowOffsetY = 4;
    const centerX = x + radius * 2 + shadowOffsetX + 2;
    const centerY = y + radius * 2 + shadowOffsetY + 2;

    this.ctx.save();
    
    this.ctx.translate(centerX, centerY);
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -radius * 2);
    this.ctx.lineTo(radius * 0.5, 0);
    this.ctx.lineTo(0, radius * 2);
    this.ctx.lineTo(-radius * 1.5, 0);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.translate(-shadowOffsetX, -shadowOffsetY);
    
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
      width: radius * 4 + shadowOffsetX + 4,
      height: radius * 4 + shadowOffsetY + 4,
    });
  }

  private addGrenadeProjectile(key: string, color: string, x: number, y: number, radius: number) {
    const shadowOffsetX = 4;
    const shadowOffsetY = 4;
    const centerX = x + radius + shadowOffsetX + 2;
    const centerY = y + radius * 1.6 + shadowOffsetY + 2;

    this.ctx.save();
    
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
    this.ctx.fill();

    const bodyCenterX = centerX - shadowOffsetX;
    const bodyCenterY = centerY - shadowOffsetY;

    const shadowColor = color === TEAM_COLORS.RED ? "#813645" : "#3e4c7e";
    const highlightColor = color === TEAM_COLORS.RED ? "#e39764" : "#7396d5";
    
    this.ctx.beginPath();
    this.ctx.ellipse(bodyCenterX, bodyCenterY, radius, radius * 1.1, 0, 0, Math.PI * 2);
    this.ctx.clip();
    
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    this.ctx.fillStyle = shadowColor;
    this.ctx.beginPath();
    this.ctx.arc(bodyCenterX - radius * 0.2, bodyCenterY + radius * 0.2, radius * 1.2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = highlightColor;
    this.ctx.beginPath();
    this.ctx.arc(bodyCenterX + radius * 0.2, bodyCenterY - radius * 0.2, radius * 1.2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
    
    this.ctx.save();
    this.ctx.strokeStyle = "#2e2e43";
    this.ctx.lineWidth = Math.max(1, radius * 0.15);
    this.ctx.beginPath();
    this.ctx.ellipse(bodyCenterX, bodyCenterY, radius, radius * 1.1, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(bodyCenterX - radius, bodyCenterY);
    this.ctx.lineTo(bodyCenterX + radius, bodyCenterY);
    this.ctx.stroke();
    
    const pinWidth = radius * 0.3;
    const pinHeight = radius * 0.4;
    const pinY = bodyCenterY - radius * 1.1;
    
    this.ctx.fillStyle = "#2e2e43";
    this.ctx.fillRect(bodyCenterX - pinWidth / 2, pinY - pinHeight, pinWidth, pinHeight);
    
    this.ctx.fillStyle = "#707b89";
    const ringRadius = radius * 0.25;
    this.ctx.beginPath();
    this.ctx.arc(bodyCenterX + pinWidth / 2, pinY - pinHeight / 2, ringRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = "#2e2e43";
    this.ctx.lineWidth = Math.max(0.5, radius * 0.1);
    this.ctx.beginPath();
    this.ctx.arc(bodyCenterX + pinWidth / 2, pinY - pinHeight / 2, ringRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 2 + shadowOffsetX + 4,
      height: radius * 2.2 + shadowOffsetY + 4,
    });
  }

  private addMoagProjectile(key: string, color: string, x: number, y: number, radius: number) {
    const shadowOffsetX = 4;
    const shadowOffsetY = 4;
    const centerX = x + radius + shadowOffsetX + 2;
    const centerY = y + radius + shadowOffsetY + 2;

    this.ctx.save();
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    const bodyCenterX = centerX - shadowOffsetX;
    const bodyCenterY = centerY - shadowOffsetY;
    
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(bodyCenterX, bodyCenterY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    const highlightColor = color === TEAM_COLORS.RED ? "#c06852" : "#5a78b2";
    this.ctx.fillStyle = highlightColor;
    this.ctx.beginPath();
    this.ctx.arc(bodyCenterX - radius * 0.3, bodyCenterY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = "#e39764";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(bodyCenterX, bodyCenterY - radius);
    this.ctx.quadraticCurveTo(bodyCenterX + radius * 0.5, bodyCenterY - radius * 1.5, bodyCenterX + radius, bodyCenterY - radius * 1.2);
    this.ctx.stroke();
    
    this.ctx.fillStyle = "#fceba8";
    this.ctx.beginPath();
    this.ctx.arc(bodyCenterX + radius, bodyCenterY - radius * 1.2, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(bodyCenterX, bodyCenterY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 2 + shadowOffsetX + 4,
      height: radius * 2 + shadowOffsetY + 4,
    });
  }

  private addRocketProjectile(key: string, color: string, x: number, y: number, radius: number) {
    const shadowOffsetX = 4;
    const shadowOffsetY = 4;
    const centerX = x + radius * 3 + shadowOffsetX + 2;
    const centerY = y + radius * 1.2 + shadowOffsetY + 2;

    this.ctx.save();
    
    this.ctx.translate(centerX, centerY);
    
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, radius * 3, radius * 1.2, 0, -Math.PI / 2, Math.PI / 2);
    this.ctx.lineTo(0, radius * 1.2);
    this.ctx.lineTo(0, -radius * 1.2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.translate(-shadowOffsetX, -shadowOffsetY);
    
    this.ctx.fillStyle = color;
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
      width: radius * 6 + shadowOffsetX + 4,
      height: radius * 2.4 + shadowOffsetY + 4,
    });
  }

  private addMissileProjectile(key: string, color: string, x: number, y: number, radius: number) {
    const shadowOffsetX = 4;
    const shadowOffsetY = 4;
    const centerX = x + radius * 2 + shadowOffsetX + 2;
    const centerY = y + radius + shadowOffsetY + 2;

    this.ctx.save();
    
    this.ctx.translate(centerX, centerY);
    
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.beginPath();
    this.ctx.moveTo(radius * 2, 0);
    this.ctx.lineTo(0, -radius * 0.8);
    this.ctx.lineTo(0, radius * 0.8);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.translate(-shadowOffsetX, -shadowOffsetY);

    const flameLength = radius * 1.5;
    this.ctx.fillStyle = "#f5c47c";
    this.ctx.beginPath();
    this.ctx.moveTo(0, -radius * 0.4);
    this.ctx.lineTo(-flameLength, 0);
    this.ctx.lineTo(0, radius * 0.4);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(radius * 2, 0);
    this.ctx.lineTo(0, -radius * 0.8);
    this.ctx.lineTo(0, radius * 0.8);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();

    this.textures.set(key, {
      x: x,
      y: y,
      width: radius * 4 + shadowOffsetX + 4,
      height: radius * 2 + shadowOffsetY + 4,
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
