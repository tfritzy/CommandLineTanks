import { UNIT_TO_PIXEL } from "../game";
import { Rock } from "../objects/terrain-details/Rock";
import { Tree } from "../objects/terrain-details/Tree";
import { HayBale } from "../objects/terrain-details/HayBale";
import { FenceEdge } from "../objects/terrain-details/FenceEdge";
import { FenceCorner } from "../objects/terrain-details/FenceCorner";
import { FoundationEdge } from "../objects/terrain-details/FoundationEdge";
import { FoundationCorner } from "../objects/terrain-details/FoundationCorner";
import { TargetDummy } from "../objects/terrain-details/TargetDummy";

export interface TerrainDetailTexture {
  x: number;
  y: number;
  width: number;
  height: number;
}

let globalInstance: TerrainDetailTextureSheet | null = null;

export class TerrainDetailTextureSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shadowCanvas: HTMLCanvasElement;
  private shadowCtx: CanvasRenderingContext2D;
  private textures: Map<string, TerrainDetailTexture> = new Map();
  private shadowTextures: Map<string, TerrainDetailTexture> = new Map();

  constructor() {
    const dpr = window.devicePixelRatio || 1;
    const logicalSize = 2048;

    this.canvas = document.createElement("canvas");
    this.canvas.width = logicalSize * dpr;
    this.canvas.height = logicalSize * dpr;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error(
        "Failed to get 2D context for terrain detail texture sheet"
      );
    }
    this.ctx = ctx;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;

    this.shadowCanvas = document.createElement("canvas");
    this.shadowCanvas.width = logicalSize * dpr;
    this.shadowCanvas.height = logicalSize * dpr;

    const shadowCtx = this.shadowCanvas.getContext("2d");
    if (!shadowCtx) {
      throw new Error("Failed to get 2D context for shadow texture sheet");
    }
    this.shadowCtx = shadowCtx;
    this.shadowCtx.scale(dpr, dpr);
    this.shadowCtx.imageSmoothingEnabled = false;

    this.initializeTextures();
  }

  public static getInstance(): TerrainDetailTextureSheet {
    if (!globalInstance) {
      globalInstance = new TerrainDetailTextureSheet();
    }
    return globalInstance;
  }

  private initializeTextures() {
    const padding = 8;
    const cellSize = UNIT_TO_PIXEL * 2 + padding * 2;
    let currentX = 0;
    let currentY = 0;

    this.renderTerrainDetail("rock", Rock, currentX, currentY, cellSize, 0);
    currentX += cellSize;

    this.renderTerrainDetail("tree", Tree, currentX, currentY, cellSize, 0);
    currentX += cellSize;

    this.renderTerrainDetail(
      "haybale",
      HayBale,
      currentX,
      currentY,
      cellSize,
      0
    );
    currentX += cellSize;

    this.renderTerrainDetail(
      "targetdummy",
      TargetDummy,
      currentX,
      currentY,
      cellSize,
      0
    );

    currentX = 0;
    currentY += cellSize;

    for (let rot = 0; rot < 4; rot++) {
      this.renderTerrainDetail(
        `fenceedge-${rot}`,
        FenceEdge,
        currentX,
        currentY,
        cellSize,
        rot
      );
      currentX += cellSize;
    }

    currentX = 0;
    currentY += cellSize;

    for (let rot = 0; rot < 4; rot++) {
      this.renderTerrainDetail(
        `fencecorner-${rot}`,
        FenceCorner,
        currentX,
        currentY,
        cellSize,
        rot
      );
      currentX += cellSize;
    }

    currentX = 0;
    currentY += cellSize;

    for (let rot = 0; rot < 4; rot++) {
      this.renderTerrainDetail(
        `foundationedge-${rot}`,
        FoundationEdge,
        currentX,
        currentY,
        cellSize,
        rot
      );
      currentX += cellSize;
    }

    currentX = 0;
    currentY += cellSize;

    for (let rot = 0; rot < 4; rot++) {
      this.renderTerrainDetail(
        `foundationcorner-${rot}`,
        FoundationCorner,
        currentX,
        currentY,
        cellSize,
        rot
      );
      currentX += cellSize;
    }
  }

  private renderTerrainDetail(
    key: string,
    DetailClass: any,
    atlasX: number,
    atlasY: number,
    cellSize: number,
    rotation: number
  ) {
    const padding = 8;
    const obj = new DetailClass(0, 0, null, 100, rotation);
    const centerOffset = cellSize / 2;

    this.shadowCtx.save();
    this.shadowCtx.translate(atlasX + centerOffset, atlasY + centerOffset);
    obj.drawShadow(this.shadowCtx);
    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.translate(atlasX + centerOffset, atlasY + centerOffset);
    obj.drawBody(this.ctx);
    this.ctx.restore();

    this.textures.set(key, {
      x: atlasX + padding,
      y: atlasY + padding,
      width: cellSize - padding * 2,
      height: cellSize - padding * 2,
    });

    this.shadowTextures.set(key, {
      x: atlasX + padding,
      y: atlasY + padding,
      width: cellSize - padding * 2,
      height: cellSize - padding * 2,
    });
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getShadowCanvas(): HTMLCanvasElement {
    return this.shadowCanvas;
  }

  public getTexture(key: string): TerrainDetailTexture | undefined {
    return this.textures.get(key);
  }

  public getShadowTexture(key: string): TerrainDetailTexture | undefined {
    return this.shadowTextures.get(key);
  }
}
