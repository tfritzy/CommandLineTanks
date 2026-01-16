import { COLORS, UNIT_TO_PIXEL } from "../constants";
import { renderToImageBitmap, drawTexture, type TextureImage } from "./TextureRenderer";
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

const PROJECTILE_PICKUP_TYPES = [
  "Base",
  "TripleShooter",
  "MissileLauncher",
  "Boomerang",
  "Grenade",
  "Rocket",
  "Moag",
  "Sniper"
] as const;

const CELL_SIZE_MULTIPLIER = 1.2;

class PickupTextureCache {
  private textures: Map<string, TextureImage> = new Map();
  private texturesNoShadow: Map<string, TextureImage> = new Map();
  private pickupColor: string;
  private initialized: boolean = false;

  constructor(pickupColor: string) {
    this.pickupColor = pickupColor;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const cellSize = UNIT_TO_PIXEL * CELL_SIZE_MULTIPLIER;

    const promises: Promise<void>[] = [
      this.createPickupTexture("Health", cellSize, drawHealthPackShadow, drawHealthPackBody),
      this.createPickupTexture("Shield", cellSize, drawShieldPickupShadow, drawShieldPickupBody),
      this.createPickupTexture("Unknown", cellSize, drawUnknownPickupShadow, drawUnknownPickupBody),
    ];

    for (const pickupType of PROJECTILE_PICKUP_TYPES) {
      promises.push(this.createProjectilePickupTexture(pickupType, cellSize));
      promises.push(this.createProjectilePickupTextureNoShadow(pickupType, cellSize));
    }

    await Promise.all(promises);
    this.initialized = true;
  }

  private async createPickupTexture(
    key: string,
    size: number,
    drawShadow: (ctx: CanvasRenderingContext2D, positionX: number, positionY: number) => void,
    drawBody: (ctx: CanvasRenderingContext2D, positionX: number, positionY: number) => void
  ) {
    const centerX = size / 2;
    const centerY = size / 2;

    const texture = await renderToImageBitmap(size, size, centerX, centerY, (ctx) => {
      ctx.translate(centerX, centerY);
      drawShadow(ctx, 0, 0);
      drawBody(ctx, 0, 0);
    });

    this.textures.set(key, texture);
  }

  private async createProjectilePickupTexture(key: string, size: number) {
    const centerX = size / 2;
    const centerY = size / 2;
    const angle = -Math.PI / 4;

    const texture = await renderToImageBitmap(size, size, centerX, centerY, (ctx) => {
      ctx.translate(centerX, centerY);

      switch (key) {
        case "Base": {
          const radius = 0.1 * UNIT_TO_PIXEL;
          drawNormalProjectileShadow(ctx, -3, 3, radius);
          drawNormalProjectileBody(ctx, 0, 0, radius, this.pickupColor);
          break;
        }
        case "TripleShooter": {
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
              ctx,
              trianglePositions[i].x - 3,
              trianglePositions[i].y + 3,
              radius
            );
          }
          for (let i = 0; i < 3; i++) {
            drawNormalProjectileBody(
              ctx,
              trianglePositions[i].x,
              trianglePositions[i].y,
              radius,
              this.pickupColor
            );
          }
          break;
        }
        case "MissileLauncher": {
          const radius = 0.2 * UNIT_TO_PIXEL;
          drawMissileShadow(ctx, -3, 3, radius, angle);
          drawMissileBody(ctx, 0, 0, radius, angle, this.pickupColor);
          break;
        }
        case "Rocket": {
          const radius = 0.1 * UNIT_TO_PIXEL;
          drawRocketShadow(ctx, -3, 3, radius, angle);
          drawRocketBody(ctx, 0, 0, radius, angle, this.pickupColor);
          break;
        }
        case "Grenade": {
          const radius = 0.2 * UNIT_TO_PIXEL;
          drawGrenadeShadow(ctx, -3, 3, radius);
          drawGrenadeBody(ctx, 0, 0, radius, this.pickupColor);
          break;
        }
        case "Boomerang": {
          const radius = 0.18 * UNIT_TO_PIXEL;
          const armWidth = radius * 0.8;
          const armLength = radius * 2.2;
          drawBoomerangShadow(ctx, -3, 3, armLength, armWidth);
          drawBoomerangBody(ctx, 0, 0, armLength, armWidth, this.pickupColor);
          break;
        }
        case "Moag": {
          const scale = 0.3;
          const radius = scale * UNIT_TO_PIXEL;
          drawMoagShadow(ctx, -3, 3, scale);

          ctx.fillStyle = this.pickupColor;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case "Sniper": {
          const bulletLength = 0.4 * UNIT_TO_PIXEL;
          const bulletWidth = bulletLength * 0.3;
          const bulletBackRatio = 0.4;
          drawSniperProjectileShadow(ctx, -3, 3, bulletLength, bulletWidth, bulletBackRatio, angle);
          drawSniperProjectileBody(ctx, 0, 0, bulletLength, bulletWidth, bulletBackRatio, angle, this.pickupColor);
          break;
        }
      }
    });

    this.textures.set(key, texture);
  }

  private async createProjectilePickupTextureNoShadow(key: string, size: number) {
    const centerX = size / 2;
    const centerY = size / 2;
    const angle = -Math.PI / 4;

    const texture = await renderToImageBitmap(size, size, centerX, centerY, (ctx) => {
      ctx.translate(centerX, centerY);

      switch (key) {
        case "Base": {
          const radius = 0.1 * UNIT_TO_PIXEL;
          drawNormalProjectileBody(ctx, 0, 0, radius, this.pickupColor);
          break;
        }
        case "TripleShooter": {
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
            drawNormalProjectileBody(
              ctx,
              trianglePositions[i].x,
              trianglePositions[i].y,
              radius,
              this.pickupColor
            );
          }
          break;
        }
        case "MissileLauncher": {
          const radius = 0.2 * UNIT_TO_PIXEL;
          drawMissileBody(ctx, 0, 0, radius, angle, this.pickupColor);
          break;
        }
        case "Rocket": {
          const radius = 0.1 * UNIT_TO_PIXEL;
          drawRocketBody(ctx, 0, 0, radius, angle, this.pickupColor);
          break;
        }
        case "Grenade": {
          const radius = 0.2 * UNIT_TO_PIXEL;
          drawGrenadeBody(ctx, 0, 0, radius, this.pickupColor);
          break;
        }
        case "Boomerang": {
          const radius = 0.18 * UNIT_TO_PIXEL;
          const armWidth = radius * 0.8;
          const armLength = radius * 2.2;
          drawBoomerangBody(ctx, 0, 0, armLength, armWidth, this.pickupColor);
          break;
        }
        case "Moag": {
          const scale = 0.3;
          const radius = scale * UNIT_TO_PIXEL;

          ctx.fillStyle = this.pickupColor;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case "Sniper": {
          const bulletLength = 0.4 * UNIT_TO_PIXEL;
          const bulletWidth = bulletLength * 0.3;
          const bulletBackRatio = 0.4;
          drawSniperProjectileBody(ctx, 0, 0, bulletLength, bulletWidth, bulletBackRatio, angle, this.pickupColor);
          break;
        }
      }
    });

    this.texturesNoShadow.set(key, texture);
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    withShadow: boolean = true
  ) {
    const textureMap = withShadow ? this.textures : this.texturesNoShadow;
    const texture = textureMap.get(key);
    if (!texture) return;

    drawTexture(ctx, texture, x, y);
  }
}

export const redTeamPickupTextureCache = new PickupTextureCache(COLORS.GAME.TEAM_RED_BRIGHT);
export const blueTeamPickupTextureCache = new PickupTextureCache(COLORS.GAME.TEAM_BLUE_BRIGHT);

export async function initializePickupTextures(): Promise<void> {
  await Promise.all([
    redTeamPickupTextureCache.initialize(),
    blueTeamPickupTextureCache.initialize(),
  ]);
}
