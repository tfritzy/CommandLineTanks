import { UNIT_TO_PIXEL } from "../game";
import { TEAM_COLORS } from "../constants";

export interface ProjectileTexture {
  x: number;
  y: number;
  width: number;
  height: number;
}

let globalInstance: ProjectileTextureSheet | null = null;

export class ProjectileTextureSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shadowCanvas: HTMLCanvasElement;
  private shadowCtx: CanvasRenderingContext2D;
  private textures: Map<string, ProjectileTexture> = new Map();
  private shadowTextures: Map<string, ProjectileTexture> = new Map();

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1024;
    this.canvas.height = 1024;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context for projectile texture sheet");
    }
    this.ctx = ctx;

    this.shadowCanvas = document.createElement("canvas");
    this.shadowCanvas.width = 1024;
    this.shadowCanvas.height = 1024;

    const shadowCtx = this.shadowCanvas.getContext("2d");
    if (!shadowCtx) {
      throw new Error("Failed to get 2D context for shadow texture sheet");
    }
    this.shadowCtx = shadowCtx;

    this.initializeTextures();
  }

  public static getInstance(): ProjectileTextureSheet {
    if (!globalInstance) {
      globalInstance = new ProjectileTextureSheet();
    }
    return globalInstance;
  }

  private initializeTextures() {
    let currentX = 0;
    let currentY = 0;
    const padding = 10;
    const rowHeight = 160;

    const textureSize = 0.5;
    const radius = textureSize * UNIT_TO_PIXEL;

    this.addNormalProjectile(
      "normal-red",
      TEAM_COLORS.RED,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 2 + padding * 4;

    this.addNormalProjectile(
      "normal-blue",
      TEAM_COLORS.BLUE,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 2 + padding * 4;

    this.addBoomerangProjectile(
      "boomerang-red",
      TEAM_COLORS.RED,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 6 + padding * 4;

    this.addBoomerangProjectile(
      "boomerang-blue",
      TEAM_COLORS.BLUE,
      currentX,
      currentY,
      radius
    );
    currentX = 0;
    currentY += rowHeight;

    this.addGrenadeProjectile(
      "grenade-red",
      TEAM_COLORS.RED,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 2 + padding * 4;

    this.addGrenadeProjectile(
      "grenade-blue",
      TEAM_COLORS.BLUE,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 2 + padding * 4;

    this.addMoagProjectile(
      "moag-red",
      TEAM_COLORS.RED,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 2 + padding * 4;

    this.addMoagProjectile(
      "moag-blue",
      TEAM_COLORS.BLUE,
      currentX,
      currentY,
      radius
    );
    currentX = 0;
    currentY += rowHeight;

    this.addRocketProjectile(
      "rocket-red",
      TEAM_COLORS.RED,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 8 + padding * 4;

    this.addRocketProjectile(
      "rocket-blue",
      TEAM_COLORS.BLUE,
      currentX,
      currentY,
      radius
    );
    currentX = 0;
    currentY += rowHeight;

    this.addMissileProjectile(
      "missile-red",
      TEAM_COLORS.RED,
      currentX,
      currentY,
      radius * 1.5
    );
    currentX += radius * 6 + padding * 4;

    this.addMissileProjectile(
      "missile-blue",
      TEAM_COLORS.BLUE,
      currentX,
      currentY,
      radius * 1.5
    );
    currentX = 0;
    currentY += rowHeight;

    this.addSpiderMineProjectile(
      "spidermine-red",
      TEAM_COLORS.RED,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 4 + padding * 4;

    this.addSpiderMineProjectile(
      "spidermine-blue",
      TEAM_COLORS.BLUE,
      currentX,
      currentY,
      radius
    );
  }

  private addNormalProjectile(
    key: string,
    color: string,
    x: number,
    y: number,
    radius: number
  ) {
    const padding = 2;
    const centerX = x + radius + padding;
    const centerY = y + radius + padding;

    this.shadowCtx.save();
    this.shadowCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.shadowCtx.beginPath();
    this.shadowCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.shadowCtx.fill();
    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();

    const textureData = {
      x: x,
      y: y,
      width: radius * 2 + padding * 2,
      height: radius * 2 + padding * 2,
    };

    this.textures.set(key, textureData);
    this.shadowTextures.set(key, textureData);
  }

  private addBoomerangProjectile(
    key: string,
    color: string,
    x: number,
    y: number,
    radius: number
  ) {
    const padding = 8;
    const armWidth = radius * 0.8;
    const armLength = radius * 2.2;
    const centerX = x + armLength + padding;
    const centerY = y + armLength + padding;

    const drawBoomerang = (ctx: CanvasRenderingContext2D, isShadow: boolean) => {
      ctx.save();
      ctx.translate(centerX, centerY);

      if (isShadow) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      } else {
        ctx.fillStyle = color;
        ctx.strokeStyle = "#2e2e43";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
      }

      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armLength, -armWidth * 0.4);
        ctx.quadraticCurveTo(armLength * 1.1, 0, armLength, armWidth * 0.4);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        if (!isShadow) ctx.stroke();

        ctx.restore();
      }

      // Center hub
      ctx.beginPath();
      ctx.arc(0, 0, armWidth * 0.5, 0, Math.PI * 2);
      ctx.fill();
      if (!isShadow) ctx.stroke();

      ctx.restore();
    };

    drawBoomerang(this.shadowCtx, true);
    drawBoomerang(this.ctx, false);

    const textureData = {
      x: x,
      y: y,
      width: armLength * 2 + padding * 2,
      height: armLength * 2 + padding * 2,
    };

    this.textures.set(key, textureData);
    this.shadowTextures.set(key, textureData);
  }

  private addGrenadeProjectile(
    key: string,
    color: string,
    x: number,
    y: number,
    radius: number
  ) {
    const padding = 2;
    const centerX = x + radius + padding;
    const centerY = y + radius * 1.6 + padding;
    const pinWidth = radius * 0.3;
    const pinHeight = radius * 0.4;
    const pinY = centerY - radius * 1.1;
    const ringRadius = radius * 0.25;

    this.shadowCtx.save();
    this.shadowCtx.fillStyle = "rgba(0, 0, 0, 0.3)";

    this.shadowCtx.beginPath();
    this.shadowCtx.ellipse(
      centerX,
      centerY,
      radius,
      radius * 1.1,
      0,
      0,
      Math.PI * 2
    );
    this.shadowCtx.fill();

    this.shadowCtx.fillRect(
      centerX - pinWidth / 2,
      pinY - pinHeight,
      pinWidth,
      pinHeight
    );

    this.shadowCtx.beginPath();
    this.shadowCtx.arc(
      centerX + pinWidth / 2,
      pinY - pinHeight / 2,
      ringRadius,
      0,
      Math.PI * 2
    );
    this.shadowCtx.fill();

    this.shadowCtx.restore();

    this.ctx.save();

    const shadowColor = color === TEAM_COLORS.RED ? "#813645" : "#3e4c7e";
    const highlightColor = color === TEAM_COLORS.RED ? "#e39764" : "#7396d5";

    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
    this.ctx.clip();

    this.ctx.fillStyle = color;
    this.ctx.fill();

    this.ctx.fillStyle = shadowColor;
    this.ctx.beginPath();
    this.ctx.arc(
      centerX - radius * 0.2,
      centerY + radius * 0.2,
      radius * 1.2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.fillStyle = highlightColor;
    this.ctx.beginPath();
    this.ctx.arc(
      centerX + radius * 0.2,
      centerY - radius * 0.2,
      radius * 1.2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.restore();

    this.ctx.save();
    this.ctx.strokeStyle = "#2e2e43";
    this.ctx.lineWidth = Math.max(1, radius * 0.15);
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(centerX - radius, centerY);
    this.ctx.lineTo(centerX + radius, centerY);
    this.ctx.stroke();

    this.ctx.fillStyle = "#2e2e43";
    this.ctx.fillRect(
      centerX - pinWidth / 2,
      pinY - pinHeight,
      pinWidth,
      pinHeight
    );

    this.ctx.fillStyle = "#707b89";
    this.ctx.beginPath();
    this.ctx.arc(
      centerX + pinWidth / 2,
      pinY - pinHeight / 2,
      ringRadius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.strokeStyle = "#2e2e43";
    this.ctx.lineWidth = Math.max(0.5, radius * 0.1);
    this.ctx.beginPath();
    this.ctx.arc(
      centerX + pinWidth / 2,
      pinY - pinHeight / 2,
      ringRadius,
      0,
      Math.PI * 2
    );
    this.ctx.stroke();

    this.ctx.restore();

    const textureData = {
      x: x,
      y: y,
      width: radius * 2 + padding * 2,
      height: radius * 2.6 + padding * 2,
    };

    this.textures.set(key, textureData);
    this.shadowTextures.set(key, textureData);
  }

  private addMoagProjectile(
    key: string,
    color: string,
    x: number,
    y: number,
    radius: number
  ) {
    const padding = 2;
    const centerX = x + radius + padding;
    const centerY = y + radius + padding;

    this.shadowCtx.save();
    this.shadowCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.shadowCtx.beginPath();
    this.shadowCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.shadowCtx.fill();

    this.shadowCtx.lineWidth = 2;
    this.shadowCtx.beginPath();
    this.shadowCtx.moveTo(centerX, centerY - radius);
    this.shadowCtx.quadraticCurveTo(
      centerX + radius * 0.5,
      centerY - radius * 1.5,
      centerX + radius,
      centerY - radius * 1.2
    );
    this.shadowCtx.stroke();

    this.shadowCtx.beginPath();
    this.shadowCtx.arc(
      centerX + radius,
      centerY - radius * 1.2,
      3,
      0,
      Math.PI * 2
    );
    this.shadowCtx.fill();

    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    const highlightColor = color === TEAM_COLORS.RED ? "#c06852" : "#5a78b2";
    this.ctx.fillStyle = highlightColor;
    this.ctx.beginPath();
    this.ctx.arc(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.4,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.strokeStyle = "#e39764";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - radius);
    this.ctx.quadraticCurveTo(
      centerX + radius * 0.5,
      centerY - radius * 1.5,
      centerX + radius,
      centerY - radius * 1.2
    );
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

    const textureData = {
      x: x,
      y: y,
      width: radius * 2 + padding * 2,
      height: radius * 2.5 + padding * 2,
    };

    this.textures.set(key, textureData);
    this.shadowTextures.set(key, textureData);
  }

  private addRocketProjectile(
    key: string,
    color: string,
    x: number,
    y: number,
    radius: number
  ) {
    const padding = 2;
    const flameLength = radius * 1.5;
    const centerX = x + radius * 3 + flameLength + padding;
    const centerY = y + radius * 1.2 + padding;

    this.shadowCtx.save();
    this.shadowCtx.translate(centerX, centerY);
    this.shadowCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.shadowCtx.beginPath();
    this.shadowCtx.ellipse(
      0,
      0,
      radius * 3,
      radius * 1.2,
      0,
      -Math.PI / 2,
      Math.PI / 2
    );
    this.shadowCtx.lineTo(0, radius * 1.2);
    this.shadowCtx.lineTo(0, -radius * 1.2);
    this.shadowCtx.closePath();
    this.shadowCtx.fill();
    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    this.ctx.fillStyle = "#f5c47c";
    this.ctx.beginPath();
    this.ctx.moveTo(0, -radius * 0.6);
    this.ctx.lineTo(-flameLength, 0);
    this.ctx.lineTo(0, radius * 0.6);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.ellipse(
      0,
      0,
      radius * 3,
      radius * 1.2,
      0,
      -Math.PI / 2,
      Math.PI / 2
    );
    this.ctx.lineTo(0, radius * 1.2);
    this.ctx.lineTo(0, -radius * 1.2);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    const textureData = {
      x: x,
      y: y,
      width: flameLength + radius * 6 + padding * 2,
      height: radius * 2.4 + padding * 2,
    };

    this.textures.set(key, textureData);
    this.shadowTextures.set(key, textureData);
  }

  private addMissileProjectile(
    key: string,
    color: string,
    x: number,
    y: number,
    radius: number
  ) {
    const padding = 2;
    const flameLength = radius * 1.0;
    const centerX = x + flameLength + padding;
    const centerY = y + radius + padding;

    this.shadowCtx.save();
    this.shadowCtx.translate(centerX, centerY);
    this.shadowCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.shadowCtx.beginPath();
    this.shadowCtx.moveTo(radius * 2, 0);
    this.shadowCtx.lineTo(0, -radius * 0.8);
    this.shadowCtx.lineTo(0, radius * 0.8);
    this.shadowCtx.closePath();
    this.shadowCtx.fill();
    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

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

    const textureData = {
      x: x,
      y: y,
      width: flameLength + radius * 2 + padding * 2,
      height: radius * 1.6 + padding * 2,
    };

    this.textures.set(key, textureData);
    this.shadowTextures.set(key, textureData);
  }

  private addSpiderMineProjectile(
    key: string,
    color: string,
    x: number,
    y: number,
    radius: number
  ) {
    const padding = 2;
    const legLength = radius * 1.2;
    const centerX = x + legLength + padding;
    const centerY = y + legLength + padding;

    this.shadowCtx.save();
    this.shadowCtx.translate(centerX, centerY);
    this.shadowCtx.fillStyle = "rgba(0, 0, 0, 0.3)";

    this.shadowCtx.beginPath();
    this.shadowCtx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
    this.shadowCtx.fill();

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const legX = Math.cos(angle) * legLength;
      const legY = Math.sin(angle) * legLength;

      this.shadowCtx.lineWidth = 2;
      this.shadowCtx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      this.shadowCtx.beginPath();
      this.shadowCtx.moveTo(0, 0);
      this.shadowCtx.lineTo(legX, legY);
      this.shadowCtx.stroke();
    }

    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const legX = Math.cos(angle) * legLength;
      const legY = Math.sin(angle) * legLength;
      const midX = Math.cos(angle) * radius * 0.8;
      const midY = Math.sin(angle) * radius * 0.8;

      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = "#2e2e43";
      this.ctx.beginPath();
      this.ctx.moveTo(midX, midY);
      this.ctx.lineTo(legX * 0.7, legY * 0.7);
      this.ctx.lineTo(legX, legY);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#2e2e43";
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    const eyeRadius = radius * 0.2;
    const eyeOffset = radius * 0.3;
    this.ctx.fillStyle = "#c06852";
    this.ctx.beginPath();
    this.ctx.arc(-eyeOffset, -eyeOffset * 0.5, eyeRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(eyeOffset, -eyeOffset * 0.5, eyeRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    const textureData = {
      x: x,
      y: y,
      width: legLength * 2 + padding * 2,
      height: legLength * 2 + padding * 2,
    };

    this.textures.set(key, textureData);
    this.shadowTextures.set(key, textureData);
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

  public drawShadow(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0,
    rotation: number = 0
  ) {
    const texture = this.shadowTextures.get(key);
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
      this.shadowCanvas,
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
