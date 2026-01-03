import { UNIT_TO_PIXEL } from "../constants";
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
import { MissileProjectile } from "../objects/projectiles/MissileProjectile";
import { RocketProjectile } from "../objects/projectiles/RocketProjectile";
import { GrenadeProjectile } from "../objects/projectiles/GrenadeProjectile";
import { BoomerangProjectile } from "../objects/projectiles/BoomerangProjectile";
import { MoagProjectile } from "../objects/projectiles/MoagProjectile";
import { NormalProjectile } from "../objects/projectiles/NormalProjectile";
import { SniperProjectile } from "../objects/projectiles/SniperProjectile";
import { projectileTextureSheet } from "./ProjectileTextureSheet";
import { getNormalizedDPR } from "../utils/dpr";

export interface PickupTexture {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PickupTextureSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textures: Map<string, PickupTexture> = new Map();
  private alliance: number;

  private static readonly CANVAS_SIZE = 1024;
  private static readonly CELL_SIZE_MULTIPLIER = 1.2;
  private static readonly PADDING = 10;

  constructor(alliance: number = 0) {
    this.alliance = alliance;
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

    this.addProjectilePickup("triple-shooter", currentX, currentY, cellSize, this.alliance);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("missile-launcher", currentX, currentY, cellSize, this.alliance);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("boomerang", currentX, currentY, cellSize, this.alliance);
    currentX += cellSize + PickupTextureSheet.PADDING;

    if (currentX + cellSize > PickupTextureSheet.CANVAS_SIZE) {
      currentX = 0;
      currentY += cellSize + PickupTextureSheet.PADDING;
    }

    this.addProjectilePickup("grenade", currentX, currentY, cellSize, this.alliance);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("rocket", currentX, currentY, cellSize, this.alliance);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("moag", currentX, currentY, cellSize, this.alliance);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("sniper", currentX, currentY, cellSize, this.alliance);
    currentX += cellSize + PickupTextureSheet.PADDING;

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

  private addProjectilePickup(key: string, x: number, y: number, size: number, alliance: number) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const angle = -Math.PI / 4;
    const velocityX = Math.cos(angle);
    const velocityY = Math.sin(angle);

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    switch (key) {
      case "triple-shooter": {
        const triangleSpacing = 0.15;
        const cos30 = Math.sqrt(3) / 2;
        const sin30 = 0.5;
        const trianglePositions = [
          { x: 0, y: triangleSpacing },
          { x: -triangleSpacing * cos30, y: -triangleSpacing * sin30 },
          { x: triangleSpacing * cos30, y: -triangleSpacing * sin30 },
        ];

        for (let i = 0; i < 3; i++) {
          const projectile = new NormalProjectile(
            trianglePositions[i].x,
            trianglePositions[i].y,
            velocityX,
            velocityY,
            0.1,
            alliance
          );
          projectile.drawShadow(this.ctx, projectileTextureSheet);
        }
        for (let i = 0; i < 3; i++) {
          const projectile = new NormalProjectile(
            trianglePositions[i].x,
            trianglePositions[i].y,
            velocityX,
            velocityY,
            0.1,
            alliance
          );
          projectile.drawBody(this.ctx, projectileTextureSheet);
        }
        break;
      }
      case "missile-launcher": {
        const projectile = new MissileProjectile(
          0,
          0,
          velocityX,
          velocityY,
          0.25,
          alliance
        );
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "rocket": {
        const projectile = new RocketProjectile(
          0,
          0,
          velocityX,
          velocityY,
          0.2,
          alliance
        );
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "grenade": {
        const projectile = new GrenadeProjectile(
          0,
          0,
          velocityX,
          velocityY,
          0.4,
          alliance
        );
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "boomerang": {
        const projectile = new BoomerangProjectile(
          0,
          0,
          velocityX,
          velocityY,
          0.3,
          alliance
        );
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "moag": {
        const projectile = new MoagProjectile(
          0,
          0,
          velocityX,
          velocityY,
          0.25,
          alliance
        );
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "sniper": {
        const sniperProjectile = new SniperProjectile(
          0,
          0,
          velocityX,
          velocityY,
          0.15,
          alliance
        );
        sniperProjectile.drawShadow(this.ctx, projectileTextureSheet);
        sniperProjectile.drawBody(this.ctx, projectileTextureSheet);
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
