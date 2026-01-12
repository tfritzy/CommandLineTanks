import { UNIT_TO_PIXEL, TERRAIN_DETAIL_RADIUS } from "../constants";
import { renderToImageBitmap, type TextureImage, TEXTURE_DPR } from "./TextureRenderer";
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

interface TerrainTexturePair {
  body: TextureImage | null;
  shadow: TextureImage | null;
}

class TerrainDetailTextureCache {
  private textures: Map<string, TerrainTexturePair> = new Map();
  private initialized: boolean = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const padding = 8;
    const cellSize = UNIT_TO_PIXEL * 2 + padding * 2;

    const promises: Promise<void>[] = [
      this.createRockTexture("rock", cellSize),
      this.createTreeTexture("tree", cellSize),
      this.createHayBaleTexture("haybale", cellSize),
      this.createTargetDummyTexture("targetdummy", cellSize),
    ];

    for (let rot = 0; rot < 4; rot++) {
      promises.push(this.createFenceEdgeTexture(`fenceedge-${rot}`, cellSize, rot));
      promises.push(this.createFenceCornerTexture(`fencecorner-${rot}`, cellSize, rot));
      promises.push(this.createFoundationEdgeTexture(`foundationedge-${rot}`, cellSize, rot));
      promises.push(this.createFoundationCornerTexture(`foundationcorner-${rot}`, cellSize, rot));
    }

    await Promise.all(promises);
    this.initialized = true;
  }

  private async createRockTexture(key: string, cellSize: number) {
    const centerOffset = cellSize / 2;
    const radius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.ROCK;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawRockBody(ctx, centerOffset, centerOffset, radius, 0);
      }),
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawRockShadow(ctx, centerOffset, centerOffset, radius);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createTreeTexture(key: string, cellSize: number) {
    const centerOffset = cellSize / 2;
    const radius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.TREE;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawTreeBody(ctx, centerOffset, centerOffset, radius, 0);
      }),
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawTreeShadow(ctx, centerOffset, centerOffset, radius);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createHayBaleTexture(key: string, cellSize: number) {
    const centerOffset = cellSize / 2;
    const radius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.HAY_BALE;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawHayBaleBody(ctx, centerOffset, centerOffset, radius, 0);
      }),
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawHayBaleShadow(ctx, centerOffset, centerOffset, radius);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createTargetDummyTexture(key: string, cellSize: number) {
    const centerOffset = cellSize / 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawTargetDummyBody(ctx, centerOffset, centerOffset, 0);
      }),
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawTargetDummyShadow(ctx, centerOffset, centerOffset);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createFenceEdgeTexture(key: string, cellSize: number, rotation: number) {
    const centerOffset = cellSize / 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawFenceEdgeBody(ctx, centerOffset, centerOffset, centerOffset, centerOffset, rotation, 0);
      }),
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawFenceEdgeShadow(ctx, centerOffset, centerOffset, centerOffset, centerOffset, rotation);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createFenceCornerTexture(key: string, cellSize: number, rotation: number) {
    const centerOffset = cellSize / 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawFenceCornerBody(ctx, centerOffset, centerOffset, centerOffset, centerOffset, rotation, 0);
      }),
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawFenceCornerShadow(ctx, centerOffset, centerOffset, centerOffset, centerOffset, rotation);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createFoundationEdgeTexture(key: string, cellSize: number, rotation: number) {
    const centerOffset = cellSize / 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawFoundationEdgeBody(ctx, centerOffset, centerOffset, centerOffset, centerOffset, rotation, 0);
      }),
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawFoundationEdgeShadow(ctx, centerOffset, centerOffset, centerOffset, centerOffset, rotation);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  private async createFoundationCornerTexture(key: string, cellSize: number, rotation: number) {
    const centerOffset = cellSize / 2;

    const [body, shadow] = await Promise.all([
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawFoundationCornerBody(ctx, centerOffset, centerOffset, centerOffset, centerOffset, rotation, 0);
      }),
      renderToImageBitmap(cellSize, cellSize, centerOffset, centerOffset, (ctx) => {
        drawFoundationCornerShadow(ctx, centerOffset, centerOffset, centerOffset, centerOffset, rotation);
      }),
    ]);

    this.textures.set(key, { body, shadow });
  }

  public getTexture(key: string): TextureImage | null {
    return this.textures.get(key)?.body ?? null;
  }

  public getShadowTexture(key: string): TextureImage | null {
    return this.textures.get(key)?.shadow ?? null;
  }

  public drawBody(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0
  ) {
    const pair = this.textures.get(key);
    if (!pair?.body) return;

    const texture = pair.body;
    const offset = -UNIT_TO_PIXEL * scale;

    ctx.drawImage(
      texture.image,
      0,
      0,
      texture.width * TEXTURE_DPR,
      texture.height * TEXTURE_DPR,
      x * UNIT_TO_PIXEL + offset,
      y * UNIT_TO_PIXEL + offset,
      texture.width * scale,
      texture.height * scale
    );
  }

  public drawShadow(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0
  ) {
    const pair = this.textures.get(key);
    if (!pair?.shadow) return;

    const texture = pair.shadow;
    const offset = -UNIT_TO_PIXEL * scale;

    ctx.drawImage(
      texture.image,
      0,
      0,
      texture.width * TEXTURE_DPR,
      texture.height * TEXTURE_DPR,
      x * UNIT_TO_PIXEL + offset,
      y * UNIT_TO_PIXEL + offset,
      texture.width * scale,
      texture.height * scale
    );
  }
}

export const terrainDetailTextureCache = new TerrainDetailTextureCache();
