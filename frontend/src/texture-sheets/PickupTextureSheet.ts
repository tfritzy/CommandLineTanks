import { COLORS, UNIT_TO_PIXEL } from "../constants";
import {
  drawHealthPackShadow,
  drawHealthPackBody,
} from "../drawing/entities/health-pack";
import {
  drawShieldPickupShadow,
  drawShieldPickupBody,
} from "../drawing/entities/shield-pickup";
import {
  drawUnknownPickupShadow,
  drawUnknownPickupBody,
} from "../drawing/entities/unknown-pickup";
import {
  drawNormalProjectileShadow,
  drawNormalProjectileBody,
} from "../drawing/projectiles/normal";
import {
  drawMissileShadow,
  drawMissileBody,
} from "../drawing/projectiles/missile";
import {
  drawRocketShadow,
  drawRocketBody,
} from "../drawing/projectiles/rocket";
import {
  drawGrenadeShadow,
  drawGrenadeBody,
} from "../drawing/projectiles/grenade";
import {
  drawBoomerangShadow,
  drawBoomerangBody,
} from "../drawing/projectiles/boomerang";
import {
  drawMoagShadow,
} from "../drawing/projectiles/moag";
import {
  drawSniperProjectileShadow,
  drawSniperProjectileBody,
} from "../drawing/projectiles/sniper";
import { getNormalizedDPR } from "../utils/dpr";

export interface PickupTexture {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PROJECTILE_PICKUP_TYPES = [
  "triple-shooter",
  "missile-launcher",
  "boomerang",
  "grenade",
  "rocket",
  "moag",
  "sniper"
] as const;

export class PickupTextureSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textures: Map<string, PickupTexture> = new Map();
  private pickupColor: string;

  private static readonly CANVAS_SIZE = 1024;
  private static readonly CELL_SIZE_MULTIPLIER = 1.2;
  private static readonly PADDING = 10;

  constructor(pickupColor: string) {
    this.pickupColor = pickupColor;
    const dpr = getNormalizedDPR();
    this.canvas = document.createElement("canvas");
    this.canvas.width = PickupTextureSheet.CANVAS_SIZE * dpr;
    this.canvas.height = PickupTextureSheet.CANVAS_SIZE * dpr;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context for pickup texture sheet");
    }
    this.ctx = ctx;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;

    this.initializeTextures();
  }

  private initializeTextures() {
    let currentX = 0;
    let currentY = 0;
    const cellSize = UNIT_TO_PIXEL * PickupTextureSheet.CELL_SIZE_MULTIPLIER;

    this.addPickup(
      "health",
      currentX,
      currentY,
      cellSize,
      drawHealthPackShadow,
      drawHealthPackBody
    );
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addPickup(
      "shield",
      currentX,
      currentY,
      cellSize,
      drawShieldPickupShadow,
      drawShieldPickupBody
    );
    currentX += cellSize + PickupTextureSheet.PADDING;

    for (const pickupType of PROJECTILE_PICKUP_TYPES) {
      this.addProjectilePickup(pickupType, currentX, currentY, cellSize);
      currentX += cellSize + PickupTextureSheet.PADDING;

      if (currentX + cellSize > PickupTextureSheet.CANVAS_SIZE) {
        currentX = 0;
        currentY += cellSize + PickupTextureSheet.PADDING;
      }
    }

    this.addPickup(
      "unknown",
      currentX,
      currentY,
      cellSize,
      drawUnknownPickupShadow,
      drawUnknownPickupBody
    );
  }

  private addPickup(
    key: string,
    x: number,
    y: number,
    size: number,
    drawShadow: (
      ctx: CanvasRenderingContext2D,
      positionX: number,
      positionY: number
    ) => void,
    drawBody: (
      ctx: CanvasRenderingContext2D,
      positionX: number,
      positionY: number
    ) => void
  ) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    drawShadow(this.ctx, 0, 0);
    drawBody(this.ctx, 0, 0);
    this.ctx.restore();

    const textureData = {
      x: x,
      y: y,
      width: size,
      height: size,
    };

    this.textures.set(key, textureData);
  }

  private addProjectilePickup(key: string, x: number, y: number, size: number) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const angle = -Math.PI / 4;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    switch (key) {
      case "triple-shooter": {
        const triangleSpacing = 0.15 * UNIT_TO_PIXEL;
        const cos30 = Math.sqrt(3) / 2;
        const sin30 = 0.5;
        const trianglePositions = [
          { x: 0, y: triangleSpacing },
          { x: -triangleSpacing * cos30, y: -triangleSpacing * sin30 },
          { x: triangleSpacing * cos30, y: -triangleSpacing * sin30 },
        ];
        const radius = 0.08 * UNIT_TO_PIXEL;

        for (let i = 0; i < 3; i++) {
          drawNormalProjectileShadow(
            this.ctx,
            trianglePositions[i].x - 4,
            trianglePositions[i].y + 4,
            radius
          );
        }
        for (let i = 0; i < 3; i++) {
          drawNormalProjectileBody(
            this.ctx,
            trianglePositions[i].x,
            trianglePositions[i].y,
            radius,
            this.pickupColor
          );
        }
        break;
      }
      case "missile-launcher": {
        const radius = 0.2 * UNIT_TO_PIXEL;
        drawMissileShadow(this.ctx, -4, 4, radius, angle);
        drawMissileBody(this.ctx, 0, 0, radius, angle, this.pickupColor);
        break;
      }
      case "rocket": {
        const radius = 0.1 * UNIT_TO_PIXEL;
        drawRocketShadow(this.ctx, -4, 4, radius, angle);
        drawRocketBody(this.ctx, 0, 0, radius, angle, this.pickupColor);
        break;
      }
      case "grenade": {
        const radius = 0.2 * UNIT_TO_PIXEL;
        drawGrenadeShadow(this.ctx, -4, 4, radius);
        drawGrenadeBody(this.ctx, 0, 0, radius, this.pickupColor);
        break;
      }
      case "boomerang": {
        const radius = 0.18 * UNIT_TO_PIXEL;
        const armWidth = radius * 0.8;
        const armLength = radius * 2.2;
        drawBoomerangShadow(this.ctx, -4, 4, armLength, armWidth);
        drawBoomerangBody(this.ctx, 0, 0, armLength, armWidth, this.pickupColor);
        break;
      }
      case "moag": {
        const scale = 0.3;
        const radius = scale * UNIT_TO_PIXEL;
        drawMoagShadow(this.ctx, -4, 4, scale);
        
        this.ctx.fillStyle = this.pickupColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
      }
      case "sniper": {
        const bulletLength = 0.4 * UNIT_TO_PIXEL;
        const bulletWidth = bulletLength * 0.3;
        const bulletBackRatio = 0.4;
        drawSniperProjectileShadow(this.ctx, -4, 4, bulletLength, bulletWidth, bulletBackRatio, angle);
        drawSniperProjectileBody(this.ctx, 0, 0, bulletLength, bulletWidth, bulletBackRatio, angle, this.pickupColor);
        break;
      }
    }

    this.ctx.restore();

    const textureData = {
      x: x,
      y: y,
      width: size,
      height: size,
    };

    this.textures.set(key, textureData);
  }

  public getTexture(key: string): PickupTexture | undefined {
    return this.textures.get(key);
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number
  ) {
    const texture = this.textures.get(key);
    if (!texture) return;

    const dpr = getNormalizedDPR();

    ctx.drawImage(
      this.canvas,
      texture.x * dpr,
      texture.y * dpr,
      texture.width * dpr,
      texture.height * dpr,
      x - texture.width / 2,
      y - texture.height / 2,
      texture.width,
      texture.height
    );
  }
}

export const redTeamPickupTextureSheet = new PickupTextureSheet(COLORS.GAME.TEAM_RED_BRIGHT);
export const blueTeamPickupTextureSheet = new PickupTextureSheet(COLORS.GAME.TEAM_BLUE_BRIGHT);
