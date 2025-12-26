import { UNIT_TO_PIXEL } from "../game";
import { drawHealthPackShadow, drawHealthPackBody } from "../drawing/entities/health-pack";
import { drawShieldPickupShadow, drawShieldPickupBody } from "../drawing/entities/shield-pickup";
import { drawUnknownPickupShadow, drawUnknownPickupBody } from "../drawing/entities/unknown-pickup";
import { MissileProjectile } from "../objects/projectiles/MissileProjectile";
import { RocketProjectile } from "../objects/projectiles/RocketProjectile";
import { GrenadeProjectile } from "../objects/projectiles/GrenadeProjectile";
import { BoomerangProjectile } from "../objects/projectiles/BoomerangProjectile";
import { MoagProjectile } from "../objects/projectiles/MoagProjectile";
import { NormalProjectile } from "../objects/projectiles/NormalProjectile";
import { SpiderMineProjectile } from "../objects/projectiles/SpiderMineProjectile";
import { projectileTextureSheet } from "./ProjectileTextureSheet";

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

  private static readonly CANVAS_SIZE = 512;
  private static readonly CELL_SIZE_MULTIPLIER = 1.2;
  private static readonly PADDING = 10;

  constructor() {
    const dpr = window.devicePixelRatio || 1;

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

    this.addPickup("health", currentX, currentY, cellSize, drawHealthPackShadow, drawHealthPackBody);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addPickup("shield", currentX, currentY, cellSize, drawShieldPickupShadow, drawShieldPickupBody);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("triple-shooter", currentX, currentY, cellSize);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("missile-launcher", currentX, currentY, cellSize);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("boomerang", currentX, currentY, cellSize);
    currentX += cellSize + PickupTextureSheet.PADDING;

    if (currentX + cellSize > PickupTextureSheet.CANVAS_SIZE) {
      currentX = 0;
      currentY += cellSize + PickupTextureSheet.PADDING;
    }

    this.addProjectilePickup("grenade", currentX, currentY, cellSize);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("rocket", currentX, currentY, cellSize);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("moag", currentX, currentY, cellSize);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("spider-mine", currentX, currentY, cellSize);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addProjectilePickup("sniper", currentX, currentY, cellSize);
    currentX += cellSize + PickupTextureSheet.PADDING;

    this.addPickup("unknown", currentX, currentY, cellSize, drawUnknownPickupShadow, drawUnknownPickupBody);
  }

  private addPickup(
    key: string,
    x: number,
    y: number,
    size: number,
    drawShadow: (ctx: CanvasRenderingContext2D, positionX: number, positionY: number) => void,
    drawBody: (ctx: CanvasRenderingContext2D, positionX: number, positionY: number) => void
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

  private addProjectilePickup(
    key: string,
    x: number,
    y: number,
    size: number
  ) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const angle = -Math.PI / 4;
    const velocityX = Math.cos(angle);
    const velocityY = Math.sin(angle);

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    switch (key) {
      case "triple-shooter": {
        const arcAngle = 0.4;
        const arcRadius = 0.25;

        for (let i = 0; i < 3; i++) {
          const projectileAngle = angle + (i - 1) * arcAngle;
          const offsetX = Math.cos(angle + Math.PI / 2) * (i - 1) * arcRadius * UNIT_TO_PIXEL;
          const offsetY = Math.sin(angle + Math.PI / 2) * (i - 1) * arcRadius * UNIT_TO_PIXEL;
          const forwardOffset = i === 1 ? 0.1 * UNIT_TO_PIXEL : 0;
          const projX = offsetX + Math.cos(angle) * forwardOffset;
          const projY = offsetY + Math.sin(angle) * forwardOffset;
          const projVelX = Math.cos(projectileAngle);
          const projVelY = Math.sin(projectileAngle);

          const projectile = new NormalProjectile(projX / UNIT_TO_PIXEL, projY / UNIT_TO_PIXEL, projVelX, projVelY, 0.1, 0);
          projectile.drawShadow(this.ctx, projectileTextureSheet);
        }
        for (let i = 0; i < 3; i++) {
          const projectileAngle = angle + (i - 1) * arcAngle;
          const offsetX = Math.cos(angle + Math.PI / 2) * (i - 1) * arcRadius * UNIT_TO_PIXEL;
          const offsetY = Math.sin(angle + Math.PI / 2) * (i - 1) * arcRadius * UNIT_TO_PIXEL;
          const forwardOffset = i === 1 ? 0.1 * UNIT_TO_PIXEL : 0;
          const projX = offsetX + Math.cos(angle) * forwardOffset;
          const projY = offsetY + Math.sin(angle) * forwardOffset;
          const projVelX = Math.cos(projectileAngle);
          const projVelY = Math.sin(projectileAngle);

          const projectile = new NormalProjectile(projX / UNIT_TO_PIXEL, projY / UNIT_TO_PIXEL, projVelX, projVelY, 0.1, 0);
          projectile.drawBody(this.ctx, projectileTextureSheet);
        }
        break;
      }
      case "missile-launcher": {
        const projectile = new MissileProjectile(0, 0, velocityX, velocityY, 0.3, 0);
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "rocket": {
        const projectile = new RocketProjectile(0, 0, velocityX, velocityY, 0.2, 0);
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "grenade": {
        const projectile = new GrenadeProjectile(0, 0, velocityX, velocityY, 0.4, 0);
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "boomerang": {
        const projectile = new BoomerangProjectile(0, 0, velocityX, velocityY, 0.3, 0);
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "moag": {
        const projectile = new MoagProjectile(0, 0, velocityX, velocityY, 0.25, 0);
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "spider-mine": {
        const projectile = new SpiderMineProjectile(0, 0, velocityX, velocityY, 0.2, 0);
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
        break;
      }
      case "sniper": {
        const projectile = new NormalProjectile(0, 0, velocityX, velocityY, 0.15, 0);
        projectile.drawShadow(this.ctx, projectileTextureSheet);
        projectile.drawBody(this.ctx, projectileTextureSheet);
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
    const dpr = window.devicePixelRatio || 1;

    ctx.drawImage(
      this.canvas,
      Math.round(texture.x * dpr),
      Math.round(texture.y * dpr),
      Math.round(texture.width * dpr),
      Math.round(texture.height * dpr),
      Math.round((x - texture.width / 2) * dpr) / dpr,
      Math.round((y - texture.height / 2) * dpr) / dpr,
      texture.width,
      texture.height
    );
  }
}

export const pickupTextureSheet = new PickupTextureSheet();
