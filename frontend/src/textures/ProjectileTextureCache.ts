import { UNIT_TO_PIXEL } from "../constants";
import { renderToImageBitmap, drawTexture, type TextureImage } from "./TextureRenderer";
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
import { COLORS } from "../theme/colors";

interface ProjectileTexturePair {
  body: TextureImage | null;
  shadow: TextureImage | null;
}

class ProjectileTextureCache {
  private textures: Map<string, ProjectileTexturePair> = new Map();
  private initialized: boolean = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const textureSize = 0.5;
    const radius = textureSize * UNIT_TO_PIXEL;

    await Promise.all([
      this.createNormalTextures("normal-0", COLORS.GAME.TEAM_RED_BRIGHT, radius),
      this.createNormalTextures("normal-1", COLORS.GAME.TEAM_BLUE_BRIGHT, radius),
      this.createBoomerangTextures("boomerang-0", COLORS.GAME.TEAM_RED_BRIGHT, radius),
      this.createBoomerangTextures("boomerang-1", COLORS.GAME.TEAM_BLUE_BRIGHT, radius),
      this.createGrenadeTextures("grenade-0", COLORS.GAME.TEAM_RED_BRIGHT, radius),
      this.createGrenadeTextures("grenade-1", COLORS.GAME.TEAM_BLUE_BRIGHT, radius),
      this.createMoagTextures("moag-0", 0, radius),
      this.createMoagTextures("moag-1", 1, radius),
      this.createRocketTextures("rocket-0", COLORS.GAME.TEAM_RED_BRIGHT, radius),
      this.createRocketTextures("rocket-1", COLORS.GAME.TEAM_BLUE_BRIGHT, radius),
      this.createMissileTextures("missile-0", COLORS.GAME.TEAM_RED_BRIGHT, radius * 1.5),
      this.createMissileTextures("missile-1", COLORS.GAME.TEAM_BLUE_BRIGHT, radius * 1.5),
      this.createSniperTextures("sniper-0", COLORS.GAME.TEAM_RED_BRIGHT, radius),
      this.createSniperTextures("sniper-1", COLORS.GAME.TEAM_BLUE_BRIGHT, radius),
    ]);

    this.initialized = true;
  }

  private async createNormalTextures(key: string, color: string, radius: number) {
    const padding = 2;
    const size = radius * 2 + padding * 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(size, size, size / 2, size / 2, (ctx) => {
        drawNormalProjectileBody(ctx, size / 2, size / 2, radius, color);
      }),
      renderToImageBitmap(size, size, size / 2, size / 2, (ctx) => {
        drawNormalProjectileShadow(ctx, size / 2, size / 2, radius);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createBoomerangTextures(key: string, color: string, radius: number) {
    const padding = 8;
    const armWidth = radius * 0.8;
    const armLength = radius * 2.2;
    const size = armLength * 2 + padding * 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(size, size, size / 2, size / 2, (ctx) => {
        drawBoomerangBody(ctx, size / 2, size / 2, armLength, armWidth, color);
      }),
      renderToImageBitmap(size, size, size / 2, size / 2, (ctx) => {
        drawBoomerangShadow(ctx, size / 2, size / 2, armLength, armWidth);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createGrenadeTextures(key: string, color: string, radius: number) {
    const padding = 2;
    const width = radius * 2 + padding * 2;
    const height = radius * 2.6 + padding * 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(width, height, width / 2, height / 2, (ctx) => {
        drawGrenadeBody(ctx, width / 2, height / 2, radius, color);
      }),
      renderToImageBitmap(width, height, width / 2, height / 2, (ctx) => {
        drawGrenadeShadow(ctx, width / 2, height / 2, radius);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createMoagTextures(key: string, alliance: number, radius: number) {
    const padding = 2;
    const size = radius * 2 + padding * 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(size, size, size / 2, size / 2, (ctx) => {
        drawMoagBody(ctx, size / 2, size / 2, 0.5, alliance);
      }),
      renderToImageBitmap(size, size, size / 2, size / 2, (ctx) => {
        drawMoagShadow(ctx, size / 2, size / 2, 0.5);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createRocketTextures(key: string, color: string, radius: number) {
    const padding = 2;
    const flameLength = radius * 1.5;
    const width = flameLength + radius * 6 + padding * 2;
    const height = radius * 2.4 + padding * 2;
    const centerX = radius * 3 + flameLength + padding;
    const centerY = radius * 1.2 + padding;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(width, height, centerX, centerY, (ctx) => {
        drawRocketBody(ctx, centerX, centerY, radius, 0, color);
      }),
      renderToImageBitmap(width, height, centerX, centerY, (ctx) => {
        drawRocketShadow(ctx, centerX, centerY, radius, 0);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createMissileTextures(key: string, color: string, radius: number) {
    const padding = 2;
    const flameLength = radius * 1.0;
    const width = flameLength + radius * 2 + padding * 2;
    const height = radius * 1.6 + padding * 2;
    const centerX = flameLength + padding;
    const centerY = radius + padding;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(width, height, centerX, centerY, (ctx) => {
        drawMissileBody(ctx, centerX, centerY, radius, 0, color);
      }),
      renderToImageBitmap(width, height, centerX, centerY, (ctx) => {
        drawMissileShadow(ctx, centerX, centerY, radius, 0);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createSniperTextures(key: string, color: string, radius: number) {
    const padding = 4;
    const bulletLength = radius * 2.5;
    const bulletWidth = radius * 0.8;
    const bulletBackRatio = 0.5;
    const width = bulletLength + bulletLength * bulletBackRatio + padding * 2;
    const height = bulletWidth * 2.4 + padding * 2;
    const centerX = bulletLength * bulletBackRatio + padding;
    const centerY = bulletWidth * 1.2 + padding;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(width, height, centerX, centerY, (ctx) => {
        drawSniperProjectileBody(
          ctx,
          centerX,
          centerY,
          bulletLength,
          bulletWidth,
          bulletBackRatio,
          0,
          color
        );
      }),
      renderToImageBitmap(width, height, centerX, centerY, (ctx) => {
        drawSniperProjectileShadow(
          ctx,
          centerX,
          centerY,
          bulletLength,
          bulletWidth,
          bulletBackRatio,
          0
        );
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  public drawProjectile(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0,
    rotation: number = 0
  ) {
    const pair = this.textures.get(key);
    if (!pair?.body) return;

    drawTexture(ctx, pair.body, x, y, scale, rotation);
  }

  public drawShadow(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0,
    rotation: number = 0
  ) {
    const pair = this.textures.get(key);
    if (!pair?.shadow) return;

    drawTexture(ctx, pair.shadow, x, y, scale, rotation);
  }
}

export interface IProjectileTextureCache {
  drawProjectile(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale?: number,
    rotation?: number
  ): void;
  drawShadow(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale?: number,
    rotation?: number
  ): void;
}

export const projectileTextureCache = new ProjectileTextureCache();
