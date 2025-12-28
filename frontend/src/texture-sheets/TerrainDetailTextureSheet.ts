import { UNIT_TO_PIXEL, TERRAIN_DETAIL_RADIUS } from "../constants";
import { drawRockShadow, drawRockBody } from "../drawing/terrain-details/rock";
import { drawTreeShadow, drawTreeBody } from "../drawing/terrain-details/tree";
import {
  drawHayBaleShadow,
  drawHayBaleBody,
} from "../drawing/terrain-details/hay-bale";
import {
  drawFenceEdgeShadow,
  drawFenceEdgeBody,
} from "../drawing/terrain-details/fence-edge";
import {
  drawFenceCornerShadow,
  drawFenceCornerBody,
} from "../drawing/terrain-details/fence-corner";
import {
  drawFoundationEdgeShadow,
  drawFoundationEdgeBody,
} from "../drawing/terrain-details/foundation-edge";
import {
  drawFoundationCornerShadow,
  drawFoundationCornerBody,
} from "../drawing/terrain-details/foundation-corner";
import {
  drawTargetDummyShadow,
  drawTargetDummyBody,
} from "../drawing/terrain-details/target-dummy";
import { getNormalizedDPR } from "../utils/dpr";

export interface TerrainDetailTexture {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TerrainDetailTextureSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shadowCanvas: HTMLCanvasElement;
  private shadowCtx: CanvasRenderingContext2D;
  private textures: Map<string, TerrainDetailTexture> = new Map();
  private shadowTextures: Map<string, TerrainDetailTexture> = new Map();

  constructor() {
    const dpr = getNormalizedDPR();
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

  private initializeTextures() {
    const padding = 8;
    const cellSize = UNIT_TO_PIXEL * 2 + padding * 2;
    let currentX = 0;
    let currentY = 0;

    this.renderRock("rock", currentX, currentY, cellSize);
    currentX += cellSize;

    this.renderTree("tree", currentX, currentY, cellSize);
    currentX += cellSize;

    this.renderHayBale("haybale", currentX, currentY, cellSize);
    currentX += cellSize;

    this.renderTargetDummy("targetdummy", currentX, currentY, cellSize);

    currentX = 0;
    currentY += cellSize;

    for (let rot = 0; rot < 4; rot++) {
      this.renderFenceEdge(
        `fenceedge-${rot}`,
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
      this.renderFenceCorner(
        `fencecorner-${rot}`,
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
      this.renderFoundationEdge(
        `foundationedge-${rot}`,
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
      this.renderFoundationCorner(
        `foundationcorner-${rot}`,
        currentX,
        currentY,
        cellSize,
        rot
      );
      currentX += cellSize;
    }
  }

  private renderRock(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number
  ) {
    const padding = 8;
    const centerOffset = cellSize / 2;
    const centerX = atlasX + centerOffset;
    const centerY = atlasY + centerOffset;
    const radius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.ROCK;

    this.shadowCtx.save();
    this.shadowCtx.translate(centerX, centerY);
    drawRockShadow(this.shadowCtx, 0, 0, radius);
    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    drawRockBody(this.ctx, 0, 0, radius, 0);
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

  private renderTree(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number
  ) {
    const padding = 8;
    const centerOffset = cellSize / 2;
    const centerX = atlasX + centerOffset;
    const centerY = atlasY + centerOffset;
    const radius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.TREE;

    this.shadowCtx.save();
    this.shadowCtx.translate(centerX, centerY);
    drawTreeShadow(this.shadowCtx, 0, 0, radius);
    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    drawTreeBody(this.ctx, 0, 0, radius, 0);
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

  private renderHayBale(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number
  ) {
    const padding = 8;
    const centerOffset = cellSize / 2;
    const centerX = atlasX + centerOffset;
    const centerY = atlasY + centerOffset;
    const radius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.HAY_BALE;

    this.shadowCtx.save();
    this.shadowCtx.translate(centerX, centerY);
    drawHayBaleShadow(this.shadowCtx, 0, 0, radius);
    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    drawHayBaleBody(this.ctx, 0, 0, radius, 0);
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

  private renderTargetDummy(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number
  ) {
    const padding = 8;
    const centerOffset = cellSize / 2;
    const centerX = atlasX + centerOffset;
    const centerY = atlasY + centerOffset;

    this.shadowCtx.save();
    this.shadowCtx.translate(centerX, centerY);
    drawTargetDummyShadow(this.shadowCtx, 0, 0);
    this.shadowCtx.restore();

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    drawTargetDummyBody(this.ctx, 0, 0, 0);
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

  private renderFenceEdge(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number,
    rotation: number
  ) {
    const padding = 8;
    const centerOffset = cellSize / 2;
    const x = atlasX + centerOffset;
    const y = atlasY + centerOffset;

    this.shadowCtx.save();
    drawFenceEdgeShadow(this.shadowCtx, x, y, x, y, rotation);
    this.shadowCtx.restore();

    this.ctx.save();
    drawFenceEdgeBody(this.ctx, x, y, x, y, rotation, 0);
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

  private renderFenceCorner(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number,
    rotation: number
  ) {
    const padding = 8;
    const centerOffset = cellSize / 2;
    const x = atlasX + centerOffset;
    const y = atlasY + centerOffset;

    this.shadowCtx.save();
    drawFenceCornerShadow(this.shadowCtx, x, y, x, y, rotation);
    this.shadowCtx.restore();

    this.ctx.save();
    drawFenceCornerBody(this.ctx, x, y, x, y, rotation, 0);
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

  private renderFoundationEdge(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number,
    rotation: number
  ) {
    const padding = 8;
    const centerOffset = cellSize / 2;
    const x = atlasX + centerOffset;
    const y = atlasY + centerOffset;

    this.shadowCtx.save();
    drawFoundationEdgeShadow(this.shadowCtx, x, y, x, y, rotation);
    this.shadowCtx.restore();

    this.ctx.save();
    drawFoundationEdgeBody(this.ctx, x, y, x, y, rotation, 0);
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

  private renderFoundationCorner(
    key: string,
    atlasX: number,
    atlasY: number,
    cellSize: number,
    rotation: number
  ) {
    const padding = 8;
    const centerOffset = cellSize / 2;
    const x = atlasX + centerOffset;
    const y = atlasY + centerOffset;

    this.shadowCtx.save();
    drawFoundationCornerShadow(this.shadowCtx, x, y, x, y, rotation);
    this.shadowCtx.restore();

    this.ctx.save();
    drawFoundationCornerBody(this.ctx, x, y, x, y, rotation, 0);
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

export const terrainDetailTextureSheet = new TerrainDetailTextureSheet();
