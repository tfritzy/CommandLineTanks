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

    ctx.beginPath();
    ctx.moveTo(half, half);

    if (tl) {
      ctx.lineTo(0, half);
      ctx.lineTo(0, 0);
      ctx.lineTo(half, 0);
    } else {
      ctx.lineTo(0, half);
      ctx.arcTo(0, 0, half, 0, half);
      ctx.lineTo(half, 0);
    }

    if (tr) {
      ctx.lineTo(half, 0);
      ctx.lineTo(size, 0);
      ctx.lineTo(size, half);
    } else {
      ctx.lineTo(half, 0);
      ctx.arcTo(size, 0, size, half, half);
      ctx.lineTo(size, half);
    }

    if (br) {
      ctx.lineTo(size, half);
      ctx.lineTo(size, size);
      ctx.lineTo(half, size);
    } else {
      ctx.lineTo(size, half);
      ctx.arcTo(size, size, half, size, half);
      ctx.lineTo(half, size);
    }

    if (bl) {
      ctx.lineTo(half, size);
      ctx.lineTo(0, size);
      ctx.lineTo(0, half);
    } else {
      ctx.lineTo(half, size);
      ctx.arcTo(0, size, 0, half, half);
      ctx.lineTo(0, half);
    }

    ctx.closePath();
    ctx.fill();
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
