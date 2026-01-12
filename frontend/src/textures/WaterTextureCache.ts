import { UNIT_TO_PIXEL } from "../constants";
import { renderToImageBitmap, type TextureImage } from "./TextureRenderer";
import { COLORS } from "../theme/colors";
import { getNormalizedDPR } from "../utils/dpr";

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
    ctx: CanvasRenderingContext2D,
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
        ctx.moveTo(half, half);
        ctx.lineTo(half, 0);
        ctx.arc(0, 0, half, 0, Math.PI / 2, false);
        ctx.lineTo(half, half);
      } else if (tr) {
        ctx.moveTo(half, half);
        ctx.lineTo(size, half);
        ctx.arc(size, 0, half, Math.PI / 2, Math.PI, false);
        ctx.lineTo(half, half);
      } else if (bl) {
        ctx.moveTo(half, half);
        ctx.lineTo(0, half);
        ctx.arc(0, size, half, -Math.PI / 2, 0, false);
        ctx.lineTo(half, half);
      } else if (br) {
        ctx.moveTo(half, half);
        ctx.lineTo(half, size);
        ctx.arc(size, size, half, Math.PI, -Math.PI / 2, false);
        ctx.lineTo(half, half);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (tl) {
      ctx.beginPath();
      ctx.rect(0, 0, half, half);
      ctx.fill();
    }

    if (tr) {
      ctx.beginPath();
      ctx.rect(half, 0, half, half);
      ctx.fill();
    }

    if (bl) {
      ctx.beginPath();
      ctx.rect(0, half, half, half);
      ctx.fill();
    }

    if (br) {
      ctx.beginPath();
      ctx.rect(half, half, half, half);
      ctx.fill();
    }

    if (count === 3) {
      ctx.beginPath();
      if (!tl && tr && bl && br) {
        ctx.moveTo(half, 0);
        ctx.arc(0, 0, half, 0, Math.PI / 2, false);
        ctx.lineTo(half, half);
        ctx.closePath();
      } else if (tl && !tr && bl && br) {
        ctx.moveTo(size, half);
        ctx.arc(size, 0, half, Math.PI / 2, Math.PI, false);
        ctx.lineTo(half, half);
        ctx.closePath();
      } else if (tl && tr && !bl && br) {
        ctx.moveTo(0, half);
        ctx.arc(0, size, half, -Math.PI / 2, 0, false);
        ctx.lineTo(half, half);
        ctx.closePath();
      } else if (tl && tr && bl && !br) {
        ctx.moveTo(half, size);
        ctx.arc(size, size, half, Math.PI, -Math.PI / 2, false);
        ctx.lineTo(half, half);
        ctx.closePath();
      }
      ctx.fill();
    }
  }

  public getTexture(index: number): TextureImage | null {
    return this.textures.get(index) ?? null;
  }

  public computeTileIndex(
    baseTerrainLayer: { tag: string }[],
    worldWidth: number,
    worldHeight: number,
    dualX: number,
    dualY: number
  ): number {
    const isWater = (x: number, y: number): boolean => {
      if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
        return false;
      }
      return baseTerrainLayer[y * worldWidth + x]?.tag === "Water";
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

    const dpr = getNormalizedDPR();

    ctx.drawImage(
      texture.image,
      0,
      0,
      texture.width * dpr,
      texture.height * dpr,
      x,
      y,
      texture.width,
      texture.height
    );
  }
}

export const waterTextureCache = new WaterTextureCache();
