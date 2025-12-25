import { UNIT_TO_PIXEL } from "../game";
import { drawHealthPackShadow, drawHealthPackBody } from "../drawing/entities/health-pack";
import { drawShieldPickupShadow, drawShieldPickupBody } from "../drawing/entities/shield-pickup";
import { drawUnknownPickupShadow, drawUnknownPickupBody } from "../drawing/entities/unknown-pickup";

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
    this.canvas = document.createElement("canvas");
    this.canvas.width = PickupTextureSheet.CANVAS_SIZE;
    this.canvas.height = PickupTextureSheet.CANVAS_SIZE;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context for pickup texture sheet");
    }
    this.ctx = ctx;

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

    ctx.drawImage(
      this.canvas,
      texture.x,
      texture.y,
      texture.width,
      texture.height,
      x - texture.width / 2,
      y - texture.height / 2,
      texture.width,
      texture.height
    );
  }
}

export const pickupTextureSheet = new PickupTextureSheet();
