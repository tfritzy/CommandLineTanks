import { UNIT_TO_PIXEL, DECORATION_COLORS } from "../constants";
import { getNormalizedDPR } from "../utils/dpr";

export interface MushroomTexture {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MushroomTextureSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textures: Map<string, MushroomTexture> = new Map();
  
  private static readonly CANVAS_SIZE = 512;
  private static readonly SIZE_VARIANTS = 5;
  private static readonly PADDING = 4;

  constructor() {
    const dpr = getNormalizedDPR();
    this.canvas = document.createElement("canvas");
    this.canvas.width = MushroomTextureSheet.CANVAS_SIZE * dpr;
    this.canvas.height = MushroomTextureSheet.CANVAS_SIZE * dpr;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context for mushroom texture sheet");
    }
    this.ctx = ctx;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;

    this.initializeTextures();
  }

  private initializeTextures() {
    const minSize = 0.085 * UNIT_TO_PIXEL;
    const maxSize = 0.125 * UNIT_TO_PIXEL;
    const sizeStep = (maxSize - minSize) / (MushroomTextureSheet.SIZE_VARIANTS - 1);

    let currentX = 0;
    let currentY = 0;
    
    for (let i = 0; i < MushroomTextureSheet.SIZE_VARIANTS; i++) {
      const size = minSize + sizeStep * i;
      const cellSize = Math.ceil(size * 2.5);
      
      if (currentX + cellSize > MushroomTextureSheet.CANVAS_SIZE) {
        currentX = 0;
        currentY += cellSize + MushroomTextureSheet.PADDING;
      }
      
      this.renderMushroom(`mushroom-${i}`, currentX, currentY, cellSize, size);
      currentX += cellSize + MushroomTextureSheet.PADDING;
    }
  }

  private renderMushroom(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number,
    size: number
  ) {
    const centerX = atlasX + cellSize / 2;
    const centerY = atlasY + cellSize / 2;
    const shadowOffset = size * 0.3;

    this.ctx.fillStyle = DECORATION_COLORS.MUSHROOM.SHADOW;
    this.ctx.beginPath();
    const shadowX = Math.round(centerX - shadowOffset);
    const shadowY = Math.round(centerY + shadowOffset);
    this.ctx.arc(shadowX, shadowY, Math.round(size), 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = DECORATION_COLORS.MUSHROOM.CAP;
    this.ctx.beginPath();
    this.ctx.arc(Math.round(centerX), Math.round(centerY), Math.round(size), 0, Math.PI * 2);
    this.ctx.fill();

    this.textures.set(key, {
      x: atlasX,
      y: atlasY,
      width: cellSize,
      height: cellSize,
    });
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getSizeVariantKey(size: number): string {
    const minSize = 0.085 * UNIT_TO_PIXEL;
    const maxSize = 0.125 * UNIT_TO_PIXEL;
    const normalizedSize = Math.max(0, Math.min(1, (size - minSize) / (maxSize - minSize)));
    const index = Math.round(normalizedSize * (MushroomTextureSheet.SIZE_VARIANTS - 1));
    return `mushroom-${index}`;
  }

  public drawMushroom(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) {
    const key = this.getSizeVariantKey(size);
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

export const mushroomTextureSheet = new MushroomTextureSheet();
