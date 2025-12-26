import { getConnection } from "../spacetimedb-connection";
import {
  type TerrainDetailRow,
  type EventContext,
} from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../constants";
import { TerrainDetailObject } from "../objects/terrain-details/TerrainDetailObject";
import { Rock } from "../objects/terrain-details/Rock";
import { Tree } from "../objects/terrain-details/Tree";
import { DeadTree } from "../objects/terrain-details/DeadTree";
import { HayBale } from "../objects/terrain-details/HayBale";
import { Label } from "../objects/terrain-details/Label";
import { FoundationEdge } from "../objects/terrain-details/FoundationEdge";
import { FoundationCorner } from "../objects/terrain-details/FoundationCorner";
import { FenceEdge } from "../objects/terrain-details/FenceEdge";
import { FenceCorner } from "../objects/terrain-details/FenceCorner";
import { TargetDummy } from "../objects/terrain-details/TargetDummy";
import { TerrainDebrisParticlesManager } from "./TerrainDebrisParticlesManager";
import { terrainDetailTextureSheet } from "../texture-sheets/TerrainDetailTextureSheet";

export class TerrainDetailManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private worldId: string;
  private detailObjects: Map<string, TerrainDetailObject> = new Map();
  private detailObjectsByPosition: (TerrainDetailObject | null)[][] = [];
  private terrainDebrisParticles: TerrainDebrisParticlesManager =
    new TerrainDebrisParticlesManager();
  private onDetailDeletedCallbacks: (() => void)[] = [];

  constructor(worldId: string, worldWidth: number, worldHeight: number) {
    this.worldId = worldId;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.initializeDetailObjectsArray();
    this.subscribeToTerrainDetails();
  }

  public updateWorldDimensions(width: number, height: number) {
    this.worldWidth = width;
    this.worldHeight = height;
    this.initializeDetailObjectsArray();
  }

  private initializeDetailObjectsArray() {
    this.detailObjectsByPosition = [];
    for (let y = 0; y < this.worldHeight; y++) {
      this.detailObjectsByPosition[y] = new Array(this.worldWidth).fill(null);
    }
  }

  private subscribeToTerrainDetails() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("TerrainDetails subscription error", e))
      .subscribe([
        `SELECT * FROM terrain_detail WHERE WorldId = '${this.worldId}'`,
      ]);

    connection.db.terrainDetail.onInsert(
      (_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
        this.createDetailObject(detail);
      }
    );

    connection.db.terrainDetail.onUpdate(
      (
        _ctx: EventContext,
        _oldDetail: Infer<typeof TerrainDetailRow>,
        newDetail: Infer<typeof TerrainDetailRow>
      ) => {
        const existingObj = this.detailObjects.get(newDetail.id);
        if (existingObj) {
          existingObj.setData(newDetail);
        } else {
          this.createDetailObject(newDetail);
        }
      }
    );

    connection.db.terrainDetail.onDelete(
      (_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
        const obj = this.detailObjects.get(detail.id);
        if (obj) {
          const x = Math.floor(obj.getX());
          const y = Math.floor(obj.getY());
          if (y >= 0 && y < this.worldHeight && x >= 0 && x < this.worldWidth) {
            this.detailObjectsByPosition[y][x] = null;
          }

          if (
            detail.type.tag === "FenceEdge" ||
            detail.type.tag === "FenceCorner"
          ) {
            this.terrainDebrisParticles.spawnParticles(
              detail.positionX,
              detail.positionY
            );
          }
        }
        this.detailObjects.delete(detail.id);
        this.onDetailDeletedCallbacks.forEach(callback => callback());
      }
    );
  }

  public update(deltaTime: number) {
    for (const obj of this.detailObjects.values()) {
      obj.update(deltaTime);
    }

    this.terrainDebrisParticles.update(deltaTime);
  }

  private createDetailObject(detail: Infer<typeof TerrainDetailRow>) {
    let obj: TerrainDetailObject | null = null;
    const {
      positionX: x,
      positionY: y,
      label,
      health,
      rotation,
      type,
    } = detail;

    switch (type.tag) {
      case "Rock":
        obj = new Rock(x, y, label, health, rotation);
        break;
      case "Tree":
        obj = new Tree(x, y, label, health, rotation);
        break;
      case "DeadTree":
        obj = new DeadTree(x, y, label, health, rotation);
        break;
      case "HayBale":
        obj = new HayBale(x, y, label, health, rotation);
        break;
      case "Label":
        obj = new Label(x, y, label, health, rotation);
        break;
      case "FoundationEdge":
        obj = new FoundationEdge(x, y, label, health, rotation);
        break;
      case "FoundationCorner":
        obj = new FoundationCorner(x, y, label, health, rotation);
        break;
      case "FenceEdge":
        obj = new FenceEdge(x, y, label, health, rotation);
        break;
      case "FenceCorner":
        obj = new FenceCorner(x, y, label, health, rotation);
        break;
      case "TargetDummy":
        obj = new TargetDummy(x, y, label, health, rotation);
        break;
    }

    if (obj) {
      this.detailObjects.set(detail.id, obj);
      const x = Math.floor(obj.getX());
      const y = Math.floor(obj.getY());
      if (y >= 0 && y < this.worldHeight && x >= 0 && x < this.worldWidth) {
        this.detailObjectsByPosition[y][x] = obj;
      }
    }
  }

  public drawShadows(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const padding = 2;
    const startX = cameraX / UNIT_TO_PIXEL - padding;
    const endX = (cameraX + canvasWidth) / UNIT_TO_PIXEL + padding;
    const startY = cameraY / UNIT_TO_PIXEL - padding;
    const endY = (cameraY + canvasHeight) / UNIT_TO_PIXEL + padding;

    const shadowCanvas = terrainDetailTextureSheet.getShadowCanvas();
    const renderSize = UNIT_TO_PIXEL * 2;

    ctx.imageSmoothingEnabled = false;

    for (const obj of this.detailObjects.values()) {
      const objX = obj.getX();
      const objY = obj.getY();

      if (objX >= startX && objX <= endX && objY >= startY && objY <= endY) {
        const texture = terrainDetailTextureSheet.getShadowTexture(
          this.getTextureKey(obj)
        );

        if (!texture) {
          console.log("no shadow texture");
        } else {
          const scale = obj.getSizeScale();
          const scaledSize = renderSize * scale;
          const offset = -UNIT_TO_PIXEL * scale;

          ctx.drawImage(
            shadowCanvas,
            texture.x,
            texture.y,
            texture.width,
            texture.height,
            objX * UNIT_TO_PIXEL + offset,
            objY * UNIT_TO_PIXEL + offset,
            scaledSize,
            scaledSize
          );
        }
      }
    }
  }

  public drawBodies(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const padding = 2;
    const startX = cameraX / UNIT_TO_PIXEL - padding;
    const endX = (cameraX + canvasWidth) / UNIT_TO_PIXEL + padding;
    const startY = cameraY / UNIT_TO_PIXEL - padding;
    const endY = (cameraY + canvasHeight) / UNIT_TO_PIXEL + padding;

    const bodyCanvas = terrainDetailTextureSheet.getCanvas();
    const renderSize = UNIT_TO_PIXEL * 2;

    ctx.imageSmoothingEnabled = false;

    for (const obj of this.detailObjects.values()) {
      const objX = obj.getX();
      const objY = obj.getY();

      if (objX >= startX && objX <= endX && objY >= startY && objY <= endY) {
        if (obj.getFlashTimer() > 0) {
          obj.drawBody(ctx);
        } else {
          const texture = terrainDetailTextureSheet.getTexture(
            this.getTextureKey(obj)
          );

          if (!texture) {
            console.log("no body texture");
          } else {
            const scale = obj.getSizeScale();
            const scaledSize = renderSize * scale;
            const offset = -UNIT_TO_PIXEL * scale;

            ctx.drawImage(
              bodyCanvas,
              texture.x,
              texture.y,
              texture.width,
              texture.height,
              objX * UNIT_TO_PIXEL + offset,
              objY * UNIT_TO_PIXEL + offset,
              scaledSize,
              scaledSize
            );

            obj.drawLabel(ctx);
          }
        }
      }
    }
  }

  private getTextureKey(obj: TerrainDetailObject): string {
    const type = obj.constructor.name.toLowerCase();

    if (type.includes("fence") || type.includes("foundation")) {
      return `${type}-${obj.getRotation()}`;
    }

    return type;
  }

  public drawParticles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    this.terrainDebrisParticles.draw(
      ctx,
      cameraX,
      cameraY,
      viewportWidth,
      viewportHeight
    );
  }

  public getDetailObjectsByPosition(): (TerrainDetailObject | null)[][] {
    return this.detailObjectsByPosition;
  }

  public onDetailDeleted(callback: () => void): void {
    this.onDetailDeletedCallbacks.push(callback);
  }
}
