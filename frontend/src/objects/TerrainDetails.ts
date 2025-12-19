import { UNIT_TO_PIXEL } from "../game";
import { TerrainDetailObject } from "./TerrainDetailObject";
import { getFlashColor } from "../utils/colors";

export class Cliff extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();

    ctx.fillStyle = getFlashColor("#c06852", this.flashTimer);
    ctx.beginPath();
    ctx.moveTo(x + UNIT_TO_PIXEL * 0.2, y + UNIT_TO_PIXEL * 0.8);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y + UNIT_TO_PIXEL * 0.2);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.8, y + UNIT_TO_PIXEL * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = getFlashColor("#813645", this.flashTimer);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class Rock extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;
    const radius = this.getRadius(0.38, 0.2, 13.37, 42.42);

    const shadowOffset = radius * 0.2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

    ctx.beginPath();
    ctx.arc(centerX - shadowOffset, centerY + shadowOffset, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;
    const radius = this.getRadius(0.38, 0.2, 13.37, 42.42);

    const bodyColor = getFlashColor("#4a4b5b", this.flashTimer);
    const shadowColor = getFlashColor("#3e3f4d", this.flashTimer);
    const highlightColor = getFlashColor("#565769", this.flashTimer);

    // Main circle clipping
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // 1. Base fill
    ctx.fillStyle = bodyColor;
    ctx.fill();

    // 2. Grounding shadow (Bottom-left dark slice)
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.15, centerY + radius * 0.15, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Highlight (Top-right bright slice)
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.arc(centerX + radius * 0.15, centerY - radius * 0.15, radius, 0, Math.PI * 2);
    ctx.fill();

    // Definition stroke
    ctx.strokeStyle = getFlashColor("#2e2e43", this.flashTimer);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class Tree extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;
    const radius = this.getRadius(0.7, 0.15, 7.77, 3.33);

    const shadowOffsetX = -radius * 0.4;
    const shadowOffsetY = radius * 0.4;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(centerX + shadowOffsetX, centerY + shadowOffsetY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;
    const radius = this.getRadius(0.7, 0.15, 7.77, 3.33);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = getFlashColor("#3e4c7e", this.flashTimer);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = getFlashColor("#495f94", this.flashTimer);
    ctx.beginPath();
    const dividerCenterX = centerX + radius * 0.4;
    const dividerCenterY = centerY - radius * 0.4;
    const dividerRadius = radius * 1.3;
    ctx.arc(dividerCenterX, dividerCenterY, dividerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class Bridge extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();

    ctx.fillStyle = getFlashColor("#c06852", this.flashTimer); // Punolite reddish-brown
    ctx.fillRect(x + UNIT_TO_PIXEL * 0.1, y + UNIT_TO_PIXEL * 0.3, UNIT_TO_PIXEL * 0.8, UNIT_TO_PIXEL * 0.4);
    ctx.strokeStyle = getFlashColor("#813645", this.flashTimer); // Darker brown
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

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class HayBale extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const worldX = (x - 0.5) * UNIT_TO_PIXEL;
    const worldY = (y - 0.5) * UNIT_TO_PIXEL;
    const unit = UNIT_TO_PIXEL;
    const centerX = worldX + unit * 0.5;
    const centerY = worldY + unit * 0.5;
    const radius = this.getRadius(0.3, 0.15, 21.21, 12.12);

    // Neutral shadow cast to the bottom-left
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(centerX - unit * 0.15, centerY + unit * 0.15, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const worldX = (x - 0.5) * UNIT_TO_PIXEL;
    const worldY = (y - 0.5) * UNIT_TO_PIXEL;
    const unit = UNIT_TO_PIXEL;
    const centerX = worldX + unit * 0.5;
    const centerY = worldY + unit * 0.5;
    const radius = this.getRadius(0.3, 0.15, 21.21, 12.12);


    // Hay bale body using palette gold/warm yellow
    ctx.fillStyle = getFlashColor("#f5c47c", this.flashTimer);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle spiral detail using palette orange-gold
    ctx.strokeStyle = getFlashColor("#e39764", this.flashTimer);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class Label extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class DeadTank extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    const shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.fillStyle = shadowColor;

    ctx.save();
    ctx.translate(centerX - 4, centerY + 4);
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 5);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    ctx.translate(centerX, centerY);

    const bodyColor = getFlashColor("#4a4b5b", this.flashTimer);
    const borderColor = getFlashColor("#2e2e43", this.flashTimer);
    const selfShadowColor = "rgba(0, 0, 0, 0.35)";

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 5);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = selfShadowColor;

    ctx.save();
    ctx.translate(-2, 2);
    ctx.rotate(this.rotation / 1000);
    ctx.beginPath();
    ctx.roundRect(0, -5, 24, 10, 3);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(-1.5, 1.5);
    ctx.rotate(this.rotation / 1000);
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 10);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.rotate(this.rotation / 1000);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(0, -5, 24, 10, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}


export class FoundationEdge extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void { }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    ctx.translate(centerX, centerY);
    ctx.rotate((this.rotation * 90 * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    const fillColor = getFlashColor("#c06852", this.flashTimer);
    const strokeColor = getFlashColor("#813645", this.flashTimer);
    const boardWidth = UNIT_TO_PIXEL * 0.2;

    // Draw 3 boards with perfect spacing
    for (let i = 0; i < 3; i++) {
      const bx = x + UNIT_TO_PIXEL * (1 / 6 + i / 3) - boardWidth / 2;
      ctx.fillStyle = fillColor;
      ctx.fillRect(bx, y + UNIT_TO_PIXEL * 0.4, boardWidth, UNIT_TO_PIXEL * 0.2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, y + UNIT_TO_PIXEL * 0.4, boardWidth, UNIT_TO_PIXEL * 0.2);
    }

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class FoundationCorner extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void { }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    ctx.translate(centerX, centerY);
    ctx.rotate((this.rotation * 90 * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    const fillColor = getFlashColor("#c06852", this.flashTimer);
    const strokeColor = getFlashColor("#813645", this.flashTimer);
    const boardWidth = UNIT_TO_PIXEL * 0.2;

    // Boards on horizontal and vertical arms
    const positions = [0.5, 0.833];
    for (const pos of positions) {
      // Horizontal arm boards
      const bhx = x + UNIT_TO_PIXEL * pos - boardWidth / 2;
      ctx.fillStyle = fillColor;
      ctx.fillRect(bhx, y + UNIT_TO_PIXEL * 0.4, boardWidth, UNIT_TO_PIXEL * 0.2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(bhx, y + UNIT_TO_PIXEL * 0.4, boardWidth, UNIT_TO_PIXEL * 0.2);

      // Vertical arm boards
      const bvy = y + UNIT_TO_PIXEL * pos - boardWidth / 2;
      ctx.fillStyle = fillColor;
      ctx.fillRect(x + UNIT_TO_PIXEL * 0.4, bvy, UNIT_TO_PIXEL * 0.2, boardWidth);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + UNIT_TO_PIXEL * 0.4, bvy, UNIT_TO_PIXEL * 0.2, boardWidth);
    }

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class FenceEdge extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    const shadowOffset = UNIT_TO_PIXEL * 0.06;
    const angle = (this.rotation * 90 * Math.PI) / 180;
    const lsX = shadowOffset * (Math.sin(angle) - Math.cos(angle));
    const lsY = shadowOffset * (Math.sin(angle) + Math.cos(angle));

    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";

    // Main rail shadow (Rotated)
    ctx.beginPath();
    ctx.roundRect(x + lsX, y + UNIT_TO_PIXEL * 0.47 + lsY, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.06, 2);
    ctx.fill();
    ctx.restore();

    // Post shadows (Drawn in world space for perfect orientation)
    ctx.save();
    ctx.restore(); // Clear previous state
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    for (let i = 0; i < 2; i++) {
      // We must calculate the world position of the posts manually since we are outside the rotation context
      const localX = 0.25 + i * 0.5 - 0.5;
      const worldX = centerX + UNIT_TO_PIXEL * (localX * Math.cos(angle));
      const worldY = centerY + UNIT_TO_PIXEL * (localX * Math.sin(angle));

      ctx.beginPath();
      ctx.arc(worldX - shadowOffset, worldY + shadowOffset, UNIT_TO_PIXEL * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    ctx.translate(centerX, centerY);
    ctx.rotate((this.rotation * 90 * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    const railColor = getFlashColor("#e39764", this.flashTimer); // Punolite-esque wood
    const postColor = getFlashColor("#c06852", this.flashTimer); // Darker wood

    // Draw main rail
    ctx.fillStyle = railColor;
    ctx.fillRect(x, y + UNIT_TO_PIXEL * 0.47, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.06);

    // Draw two posts (0.25 and 0.75)
    ctx.fillStyle = postColor;
    for (let i = 0; i < 2; i++) {
      const px = x + UNIT_TO_PIXEL * (0.25 + i * 0.5);
      ctx.beginPath();
      ctx.arc(px, y + UNIT_TO_PIXEL * 0.5, UNIT_TO_PIXEL * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class FenceCorner extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    const shadowOffset = UNIT_TO_PIXEL * 0.06;
    const angle = (this.rotation * 90 * Math.PI) / 180;
    const lsX = shadowOffset * (Math.sin(angle) - Math.cos(angle));
    const lsY = shadowOffset * (Math.sin(angle) + Math.cos(angle));

    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";

    // Horizontal and Vertical rail shadows (Rotated)
    ctx.beginPath();
    ctx.roundRect(x + UNIT_TO_PIXEL * 0.5 + lsX, y + UNIT_TO_PIXEL * 0.47 + lsY, UNIT_TO_PIXEL * 0.5, UNIT_TO_PIXEL * 0.06, 2);
    ctx.roundRect(x + UNIT_TO_PIXEL * 0.47 + lsX, y + UNIT_TO_PIXEL * 0.5 + lsY, UNIT_TO_PIXEL * 0.06, UNIT_TO_PIXEL * 0.5, 2);
    ctx.fill();
    ctx.restore();

    // Single square corner post shadow (World space)
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    const size = UNIT_TO_PIXEL * 0.22;
    ctx.beginPath();
    ctx.roundRect(centerX - size / 2 - shadowOffset, centerY - size / 2 + shadowOffset, size, size, 2);
    ctx.fill();
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    ctx.translate(centerX, centerY);
    ctx.rotate((this.rotation * 90 * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    const railColor = getFlashColor("#e39764", this.flashTimer);
    const postColor = getFlashColor("#c06852", this.flashTimer);

    // Draw rails
    ctx.fillStyle = railColor;
    ctx.fillRect(x + UNIT_TO_PIXEL * 0.5, y + UNIT_TO_PIXEL * 0.47, UNIT_TO_PIXEL * 0.5, UNIT_TO_PIXEL * 0.06);
    ctx.fillRect(x + UNIT_TO_PIXEL * 0.47, y + UNIT_TO_PIXEL * 0.5, UNIT_TO_PIXEL * 0.06, UNIT_TO_PIXEL * 0.5);

    // Single Square Corner Post (Junction)
    ctx.fillStyle = postColor;
    const size = UNIT_TO_PIXEL * 0.22;
    ctx.beginPath();
    ctx.roundRect(centerX - size / 2, centerY - size / 2, size, size, 2);
    ctx.fill();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}

export class TargetDummy extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    const shadowOffset = UNIT_TO_PIXEL * 0.1;
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.arc(centerX - shadowOffset, centerY + shadowOffset, UNIT_TO_PIXEL * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const centerY = y + UNIT_TO_PIXEL * 0.5;

    const bodyColor = getFlashColor("#813645", this.flashTimer);
    const rimColor = getFlashColor("#c06852", this.flashTimer);
    const centerColor = getFlashColor("#f5c47c", this.flashTimer);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
