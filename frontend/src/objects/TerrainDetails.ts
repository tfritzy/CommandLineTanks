import { UNIT_TO_PIXEL } from "../game";
import { TerrainDetailObject } from "./TerrainDetailObject";

export class Cliff extends TerrainDetailObject {
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    
    ctx.fillStyle = "#8b7355";
    ctx.beginPath();
    ctx.moveTo(x + UNIT_TO_PIXEL * 0.2, y + UNIT_TO_PIXEL * 0.8);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y + UNIT_TO_PIXEL * 0.2);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.8, y + UNIT_TO_PIXEL * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
    this.drawLabel(ctx);
  }
}

export class Rock extends TerrainDetailObject {
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;
    const radius = UNIT_TO_PIXEL * 0.3;
    
    ctx.fillStyle = "#696969";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#404040";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
    this.drawLabel(ctx);
  }
}

export class Tree extends TerrainDetailObject {
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;
    
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(centerX - UNIT_TO_PIXEL * 0.08, centerY - UNIT_TO_PIXEL * 0.1, UNIT_TO_PIXEL * 0.16, UNIT_TO_PIXEL * 0.4);
    
    ctx.fillStyle = "#228b22";
    ctx.beginPath();
    ctx.arc(centerX, centerY - UNIT_TO_PIXEL * 0.15, UNIT_TO_PIXEL * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a6b1a";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
    this.drawLabel(ctx);
  }
}

export class Bridge extends TerrainDetailObject {
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    
    ctx.fillStyle = "#a0522d";
    ctx.fillRect(x + UNIT_TO_PIXEL * 0.1, y + UNIT_TO_PIXEL * 0.3, UNIT_TO_PIXEL * 0.8, UNIT_TO_PIXEL * 0.4);
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + UNIT_TO_PIXEL * 0.1, y + UNIT_TO_PIXEL * 0.3, UNIT_TO_PIXEL * 0.8, UNIT_TO_PIXEL * 0.4);
    
    for (let i = 0.2; i < 0.9; i += 0.2) {
      ctx.beginPath();
      ctx.moveTo(x + UNIT_TO_PIXEL * i, y + UNIT_TO_PIXEL * 0.3);
      ctx.lineTo(x + UNIT_TO_PIXEL * i, y + UNIT_TO_PIXEL * 0.7);
      ctx.stroke();
    }
    
    ctx.restore();
    this.drawLabel(ctx);
  }
}

export class Fence extends TerrainDetailObject {
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    
    ctx.strokeStyle = "#d2691e";
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(x + UNIT_TO_PIXEL * 0.1, y + UNIT_TO_PIXEL * 0.5);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.9, y + UNIT_TO_PIXEL * 0.5);
    ctx.stroke();
    
    for (let i = 0.2; i < 1; i += 0.2) {
      ctx.beginPath();
      ctx.moveTo(x + UNIT_TO_PIXEL * i, y + UNIT_TO_PIXEL * 0.3);
      ctx.lineTo(x + UNIT_TO_PIXEL * i, y + UNIT_TO_PIXEL * 0.7);
      ctx.stroke();
    }
    
    ctx.restore();
    this.drawLabel(ctx);
  }
}

export class HayBale extends TerrainDetailObject {
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;
    const width = UNIT_TO_PIXEL * 0.6;
    const height = UNIT_TO_PIXEL * 0.4;
    
    ctx.fillStyle = "#f0e68c";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#daa520";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX - width * 0.3, centerY - height * 0.2);
    ctx.lineTo(centerX - width * 0.3, centerY + height * 0.2);
    ctx.moveTo(centerX, centerY - height * 0.2);
    ctx.lineTo(centerX, centerY + height * 0.2);
    ctx.moveTo(centerX + width * 0.3, centerY - height * 0.2);
    ctx.lineTo(centerX + width * 0.3, centerY + height * 0.2);
    ctx.stroke();
    
    ctx.restore();
    this.drawLabel(ctx);
  }
}

export class Field extends TerrainDetailObject {
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    
    ctx.fillStyle = "#daa520";
    ctx.fillRect(x + UNIT_TO_PIXEL * 0.1, y + UNIT_TO_PIXEL * 0.1, UNIT_TO_PIXEL * 0.8, UNIT_TO_PIXEL * 0.8);
    ctx.strokeStyle = "#b8860b";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + UNIT_TO_PIXEL * 0.1, y + UNIT_TO_PIXEL * 0.1, UNIT_TO_PIXEL * 0.8, UNIT_TO_PIXEL * 0.8);
    
    for (let i = 0.3; i < 0.9; i += 0.2) {
      ctx.beginPath();
      ctx.moveTo(x + UNIT_TO_PIXEL * 0.1, y + UNIT_TO_PIXEL * i);
      ctx.lineTo(x + UNIT_TO_PIXEL * 0.9, y + UNIT_TO_PIXEL * i);
      ctx.stroke();
    }
    
    ctx.restore();
    this.drawLabel(ctx);
  }
}

export class Label extends TerrainDetailObject {
  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawLabel(ctx);
  }
}
