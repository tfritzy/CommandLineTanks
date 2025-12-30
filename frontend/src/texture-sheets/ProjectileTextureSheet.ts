import { UNIT_TO_PIXEL, TEAM_COLORS } from "../constants";
import { getNormalizedDPR } from "../utils/dpr";
import {
  drawNormalProjectileShadow,
  drawNormalProjectileBody,
} from "../drawing/projectiles/normal";
import {
  drawBoomerangShadow,
  drawBoomerangBody,
} from "../drawing/projectiles/boomerang";
import { drawGrenadeShadow, drawGrenadeBody } from "../drawing/projectiles/grenade";
import { drawMoagShadow, drawMoagBody } from "../drawing/projectiles/moag";
import { drawRocketShadow, drawRocketBody } from "../drawing/projectiles/rocket";
import { drawMissileShadow, drawMissileBody } from "../drawing/projectiles/missile";
import {
  drawSniperProjectileShadow,
  drawSniperProjectileBody,
} from "../drawing/projectiles/sniper";

export interface ProjectileTexture {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ProjectileTextureSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shadowCanvas: HTMLCanvasElement;
  private shadowCtx: CanvasRenderingContext2D;
  private textures: Map<string, ProjectileTexture> = new Map();
  private shadowTextures: Map<string, ProjectileTexture> = new Map();

  constructor() {
    const dpr = getNormalizedDPR();
    const logicalSize = 1024;

    this.canvas = document.createElement("canvas");
    this.canvas.width = logicalSize * dpr;
    this.canvas.height = logicalSize * dpr;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context for projectile texture sheet");
    }
    this.ctx = ctx;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;

    this.shadowCanvas = document.createElement("canvas");
    this.shadowCanvas.width = logicalSize * dpr;
    this.shadowCanvas.height = logicalSize * dpr;

    const shadowCtx = this.shadowCanvas.getContext("2d");
    if (!shadowCtx) {
      throw new Error("Failed to get 2D context for shadow texture sheet");
    }
    this.shadowCtx = shadowCtx;
    this.shadowCtx.scale(dpr, dpr);
    this.shadowCtx.imageSmoothingEnabled = false;

    this.initializeTextures();
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

    this.addSniperProjectile(
      "sniper-red",
      TEAM_COLORS.RED,
      currentX,
      currentY,
      radius
    );
    currentX += radius * 6 + padding * 4;

    this.addSniperProjectile(
      "sniper-blue",
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

    drawNormalProjectileShadow(this.shadowCtx, centerX, centerY, radius);
    drawNormalProjectileBody(this.ctx, centerX, centerY, radius, color);

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

    drawBoomerangShadow(this.shadowCtx, centerX, centerY, armLength, armWidth);
    drawBoomerangBody(this.ctx, centerX, centerY, armLength, armWidth, color);

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

    const shadowColor = color === TEAM_COLORS.RED ? "#813645" : "#3e4c7e";
    const highlightColor = color === TEAM_COLORS.RED ? "#e39764" : "#7396d5";

    drawGrenadeShadow(this.shadowCtx, centerX, centerY, radius);
    drawGrenadeBody(this.ctx, centerX, centerY, radius, color, shadowColor, highlightColor);

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

    drawMoagShadow(this.shadowCtx, centerX, centerY, 0.5);
    drawMoagBody(this.ctx, centerX, centerY, 0.5, color === TEAM_COLORS.RED ? 0 : 1);

    const textureData = {
      x: x,
      y: y,
      width: radius * 2 + padding * 2,
      height: radius * 2 + padding * 2,
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

    drawRocketShadow(this.shadowCtx, centerX, centerY, radius, 0);
    drawRocketBody(this.ctx, centerX, centerY, radius, 0, color);

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

    drawMissileShadow(this.shadowCtx, centerX, centerY, radius, 0);
    drawMissileBody(this.ctx, centerX, centerY, radius, 0, color);

    const textureData = {
      x: x,
      y: y,
      width: flameLength + radius * 2 + padding * 2,
      height: radius * 1.6 + padding * 2,
    };

    this.textures.set(key, textureData);
    this.shadowTextures.set(key, textureData);
  }


  private addSniperProjectile(
    key: string,
    color: string,
    x: number,
    y: number,
    radius: number
  ) {
    const padding = 2;
    const bulletLength = radius * 4;
    const bulletWidth = radius * 0.4;
    const bulletBackRatio = 0.1;
    const centerX = x + bulletLength + padding;
    const centerY = y + bulletWidth + padding;

    drawSniperProjectileShadow(
      this.shadowCtx,
      centerX,
      centerY,
      bulletLength,
      bulletWidth,
      bulletBackRatio,
      0
    );
    drawSniperProjectileBody(
      this.ctx,
      centerX,
      centerY,
      bulletLength,
      bulletWidth,
      bulletBackRatio,
      0,
      color
    );

    const textureData = {
      x: x,
      y: y,
      width: bulletLength + bulletLength * bulletBackRatio + padding * 2,
      height: bulletWidth * 2 + padding * 2,
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

    const dpr = getNormalizedDPR();

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
      texture.x * dpr,
      texture.y * dpr,
      texture.width * dpr,
      texture.height * dpr,
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

    const dpr = getNormalizedDPR();

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
      texture.x * dpr,
      texture.y * dpr,
      texture.width * dpr,
      texture.height * dpr,
      -texture.width / 2,
      -texture.height / 2,
      texture.width,
      texture.height
    );

    ctx.restore();
  }
}

export const projectileTextureSheet = new ProjectileTextureSheet();
