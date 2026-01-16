import { UNIT_TO_PIXEL } from "../constants";
import { renderToImageBitmap, type TextureImage, drawTexture } from "./TextureRenderer";
import { COLORS } from "../theme/colors";

class WaterTextureCache {
  private textures: Map<number, TextureImage> = new Map();
  private initialized: boolean = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const promises: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      promises.push(this.createWaterTile(i));
    }

    await Promise.all(promises);
    this.initialized = true;
  }

  private async createWaterTile(index: number): Promise<void> {
    const tl = (index & 1) !== 0;
    const tr = (index & 2) !== 0;
    const bl = (index & 4) !== 0;
    const br = (index & 8) !== 0;

    const texture = await renderToImageBitmap(
      UNIT_TO_PIXEL,
      UNIT_TO_PIXEL,
      0,
      0,
      (ctx) => {
        this.drawWaterTileVariant(ctx, tl, tr, bl, br);
      }
    );

    this.textures.set(index, texture);
  }

  private drawWaterTileVariant(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    tl: boolean,
    tr: boolean,
    bl: boolean,
    br: boolean
  ): void {
    const size = UNIT_TO_PIXEL;
    const half = size / 2;

    ctx.fillStyle = COLORS.TERRAIN.WATER_DEEP;

    const count = (tl ? 1 : 0) + (tr ? 1 : 0) + (bl ? 1 : 0) + (br ? 1 : 0);

    if (count === 4) {
      ctx.beginPath();
      ctx.rect(0, 0, size, size);
      ctx.fill();
      return;
    }

    if (count === 0) {
      return;
    }

    if (count === 1) {
      ctx.beginPath();
      if (tl) {
        ctx.moveTo(0, 0);
        ctx.lineTo(half, 0);
        ctx.arc(0, 0, half, 0, Math.PI / 2, false);
        ctx.closePath();
      } else if (tr) {
        ctx.moveTo(size, 0);
        ctx.lineTo(size, half);
        ctx.arc(size, 0, half, Math.PI / 2, Math.PI, false);
        ctx.closePath();
      } else if (bl) {
        ctx.moveTo(0, size);
        ctx.lineTo(0, half);
        ctx.arc(0, size, half, -Math.PI / 2, 0, false);
        ctx.closePath();
      } else if (br) {
        ctx.moveTo(size, size);
        ctx.lineTo(half, size);
        ctx.arc(size, size, half, Math.PI, Math.PI * 1.5, false);
        ctx.closePath();
      }
      ctx.fill();
      return;
    }

    if (count === 2) {
      if (tl && tr) {
        ctx.beginPath();
        ctx.rect(0, 0, size, half);
        ctx.fill();
      } else if (bl && br) {
        ctx.beginPath();
        ctx.rect(0, half, size, half);
        ctx.fill();
      } else if (tl && bl) {
        ctx.beginPath();
        ctx.rect(0, 0, half, size);
        ctx.fill();
      } else if (tr && br) {
        ctx.beginPath();
        ctx.rect(half, 0, half, size);
        ctx.fill();
      } else if (tl && br) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(half, 0);
        ctx.arc(0, 0, half, 0, Math.PI / 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size, size);
        ctx.lineTo(half, size);
        ctx.arc(size, size, half, Math.PI, Math.PI * 1.5, false);
        ctx.closePath();
        ctx.fill();
      } else if (tr && bl) {
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(size, half);
        ctx.arc(size, 0, half, Math.PI / 2, Math.PI, false);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, size);
        ctx.lineTo(0, half);
        ctx.arc(0, size, half, -Math.PI / 2, 0, false);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }

    if (count === 3) {
      ctx.beginPath();
      if (!tl) {
        ctx.moveTo(half, 0);
        ctx.lineTo(size, 0);
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.lineTo(0, half);
        ctx.arc(0, 0, half, Math.PI / 2, 0, true);
      } else if (!tr) {
        ctx.moveTo(0, 0);
        ctx.lineTo(half, 0);
        ctx.arc(size, 0, half, Math.PI, Math.PI / 2, true);
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
      } else if (!bl) {
        ctx.moveTo(0, 0);
        ctx.lineTo(size, 0);
        ctx.lineTo(size, size);
        ctx.lineTo(half, size);
        ctx.arc(0, size, half, 0, -Math.PI / 2, true);
        ctx.lineTo(0, 0);
      } else if (!br) {
        ctx.moveTo(0, 0);
        ctx.lineTo(size, 0);
        ctx.lineTo(size, half);
        ctx.arc(size, size, half, -Math.PI / 2, Math.PI, true);
        ctx.lineTo(0, size);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  public getTexture(index: number): TextureImage | null {
    return this.textures.get(index) ?? null;
  }

  public computeTileIndex(
    baseTerrainLayer: { tag: string }[],
    gameWidth: number,
    gameHeight: number,
    dualX: number,
    dualY: number
  ): number {
    const isWater = (x: number, y: number): boolean => {
      if (x < 0 || x >= gameWidth || y < 0 || y >= gameHeight) {
        return false;
      }
      return baseTerrainLayer[y * gameWidth + x]?.tag === "Water";
    };

    const tl = isWater(dualX, dualY) ? 1 : 0;
    const tr = isWater(dualX + 1, dualY) ? 2 : 0;
    const bl = isWater(dualX, dualY + 1) ? 4 : 0;
    const br = isWater(dualX + 1, dualY + 1) ? 8 : 0;

    return tl | tr | bl | br;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    textureIndex: number,
    x: number,
    y: number
  ): void {
    const texture = this.textures.get(textureIndex);
    if (!texture) return;

    drawTexture(ctx, texture, x, y);
  }
}

export const waterTextureCache = new WaterTextureCache();
