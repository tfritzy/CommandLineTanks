import { getConnection } from "../spacetimedb-connection";
import { SoundManager } from "./SoundManager";
import {
  type TerrainDetailRow,
  type EventContext,
  BaseTerrain,
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
import { PenBorder } from "../objects/terrain-details/PenBorder";
import { TerrainDebrisParticlesManager } from "./TerrainDebrisParticlesManager";
import { TreeDestructionParticlesManager } from "./TreeDestructionParticlesManager";
import { MushroomDecorationsManager } from "./MushroomDecorationsManager";
import { terrainDetailTextureCache } from "../textures";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export class TerrainDetailManager {
  private gameWidth: number = 0;
  private gameHeight: number = 0;
  private gameId: string;
  private detailObjects: Map<string, TerrainDetailObject> = new Map();
  private detailObjectsByPosition: (TerrainDetailObject | null)[][] = [];
  private terrainDebrisParticles: TerrainDebrisParticlesManager =
    new TerrainDebrisParticlesManager();
  private treeDestructionParticles: TreeDestructionParticlesManager =
    new TreeDestructionParticlesManager();
  private mushroomDecorations: MushroomDecorationsManager =
    new MushroomDecorationsManager();
  private onDetailDeletedCallbacks: (() => void)[] = [];
  private soundManager: SoundManager;
  private subscription: TableSubscription<typeof TerrainDetailRow> | null = null;
  private baseTerrainLayer: BaseTerrainType[] = [];

  constructor(gameId: string, gameWidth: number, gameHeight: number, soundManager: SoundManager, baseTerrainLayer: BaseTerrainType[]) {
    this.gameId = gameId;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.soundManager = soundManager;
    this.baseTerrainLayer = baseTerrainLayer;
    this.initializeDetailObjectsArray();
    this.subscribeToTerrainDetails();
  }

  public updateGameDimensions(width: number, height: number) {
    this.gameWidth = width;
    this.gameHeight = height;
    this.initializeDetailObjectsArray();
  }

  public updateBaseTerrainLayer(baseTerrainLayer: BaseTerrainType[]) {
    this.baseTerrainLayer = baseTerrainLayer;
  }

  private isNearWater(x: number, y: number, bufferDistance: number): boolean {
    const minX = Math.max(0, Math.floor(x - bufferDistance));
    const maxX = Math.min(this.gameWidth - 1, Math.ceil(x + bufferDistance));
    const minY = Math.max(0, Math.floor(y - bufferDistance));
    const maxY = Math.min(this.gameHeight - 1, Math.ceil(y + bufferDistance));

    for (let checkY = minY; checkY <= maxY; checkY++) {
      for (let checkX = minX; checkX <= maxX; checkX++) {
        const distance = Math.sqrt((checkX - x) ** 2 + (checkY - y) ** 2);
        if (distance <= bufferDistance) {
          const index = checkY * this.gameWidth + checkX;
          if (this.baseTerrainLayer[index]?.tag === "Water") {
            return true;
          }
        }
      }
    }
    return false;
  }

  private initializeDetailObjectsArray() {
    this.detailObjectsByPosition = [];
    for (let y = 0; y < this.gameHeight; y++) {
      this.detailObjectsByPosition[y] = new Array(this.gameWidth).fill(null);
    }
  }

  private subscribeToTerrainDetails() {
    const connection = getConnection();
    if (!connection) return;

    this.subscription = subscribeToTable({
      table: connection.db.terrainDetail,
      handlers: {
        onInsert: (_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
          if (detail.gameId !== this.gameId) return;
          this.createDetailObject(detail);
        },
        onUpdate: (_ctx: EventContext, _oldDetail: Infer<typeof TerrainDetailRow>, newDetail: Infer<typeof TerrainDetailRow>) => {
          if (newDetail.gameId !== this.gameId) return;
          const existingObj = this.detailObjects.get(newDetail.id);
          if (existingObj) {
            const oldType = existingObj.getType();
            const newType = newDetail.type.tag;

            if (oldType === newType) {
              existingObj.setData(newDetail);
            } else {
              const oldX = Math.floor(existingObj.getX());
              const oldY = Math.floor(existingObj.getY());
              if (oldY >= 0 && oldY < this.gameHeight && oldX >= 0 && oldX < this.gameWidth) {
                if (this.detailObjectsByPosition[oldY][oldX] === existingObj) {
                  this.detailObjectsByPosition[oldY][oldX] = null;
                }
              }

              if (oldType === "Tree" && newType === "DeadTree") {
                this.treeDestructionParticles.spawnParticles(
                  newDetail.positionX,
                  newDetail.positionY,
                );
                this.soundManager.play("terrain-destroy", 0.5, newDetail.positionX, newDetail.positionY);
              } else if (newType === "None") {
                this.soundManager.play("terrain-destroy", 0.5, newDetail.positionX, newDetail.positionY);
                if (oldType === "Tree" || oldType === "DeadTree") {
                  this.treeDestructionParticles.spawnParticles(
                    newDetail.positionX,
                    newDetail.positionY,
                  );
                } else {
                  this.terrainDebrisParticles.spawnParticles(
                    newDetail.positionX,
                    newDetail.positionY
                  );
                }
              }

              if (newType === "None") {
                this.detailObjects.delete(newDetail.id);
              } else {
                this.createDetailObject(newDetail);
              }
            }
          } else {
            this.createDetailObject(newDetail);
          }
        },
        onDelete: (_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
          if (detail.gameId !== this.gameId) return;
          const obj = this.detailObjects.get(detail.id);
          if (obj) {
            const x = Math.floor(obj.getX());
            const y = Math.floor(obj.getY());
            if (y >= 0 && y < this.gameHeight && x >= 0 && x < this.gameWidth) {
              this.detailObjectsByPosition[y][x] = null;
            }

            this.soundManager.play("terrain-destroy", 0.5, detail.positionX, detail.positionY);

            if (
              detail.type.tag === "FenceEdge" ||
              detail.type.tag === "FenceCorner"
            ) {
              this.terrainDebrisParticles.spawnParticles(
                detail.positionX,
                detail.positionY
              );
            } else if (
              detail.type.tag === "Tree" ||
              detail.type.tag === "DeadTree"
            ) {
              this.treeDestructionParticles.spawnParticles(
                detail.positionX,
                detail.positionY
              );
            } else {
              this.terrainDebrisParticles.spawnParticles(
                detail.positionX,
                detail.positionY
              );
            }
          }
          this.detailObjects.delete(detail.id);
          this.onDetailDeletedCallbacks.forEach((callback) => callback());
        }
      }
    });
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.detailObjects.clear();
    this.onDetailDeletedCallbacks = [];
    this.terrainDebrisParticles.destroy();
    this.treeDestructionParticles.destroy();
    this.mushroomDecorations.destroy();
  }

  public update(deltaTime: number) {
    for (const obj of this.detailObjects.values()) {
      obj.update(deltaTime);
    }

    this.terrainDebrisParticles.update(deltaTime);
    this.treeDestructionParticles.update(deltaTime);
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
        this.mushroomDecorations.generateMushroomsAroundTree(
          x,
          y,
          (posX: number, posY: number) => this.isNearWater(posX, posY, 1.5)
        );
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
      case "PenBorder":
        obj = new PenBorder(x, y, label, health, rotation);
        break;
    }

    if (obj) {
      this.detailObjects.set(detail.id, obj);
      const x = Math.floor(obj.getX());
      const y = Math.floor(obj.getY());
      if (y >= 0 && y < this.gameHeight && x >= 0 && x < this.gameWidth) {
        this.detailObjectsByPosition[y][x] = obj;
      }
    }
  }

  private renderShadowPass(
    ctx: CanvasRenderingContext2D,
    startX: number,
    endX: number,
    startY: number,
    endY: number,
    isTree: boolean
  ) {
    for (const obj of this.detailObjects.values()) {
      if ((obj instanceof Tree || obj instanceof DeadTree) !== isTree) continue;

      const objX = obj.getX();
      const objY = obj.getY();

      if (objX >= startX && objX <= endX && objY >= startY && objY <= endY) {
        const scale = obj.getSizeScale();
        terrainDetailTextureCache.drawShadow(ctx, obj.getTextureKey(), objX, objY, scale);
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

    ctx.imageSmoothingEnabled = false;

    this.renderShadowPass(ctx, startX, endX, startY, endY, false);
  }

  private renderBodyPass(
    ctx: CanvasRenderingContext2D,
    startX: number,
    endX: number,
    startY: number,
    endY: number,
    isTree: boolean
  ) {
    for (const obj of this.detailObjects.values()) {
      if ((obj instanceof Tree || obj instanceof DeadTree) !== isTree) continue;

      const objX = obj.getX();
      const objY = obj.getY();

      if (objX >= startX && objX <= endX && objY >= startY && objY <= endY) {
        const scale = obj.getSizeScale();
        const textureKey = obj.getTextureKey();
        const texture = terrainDetailTextureCache.getTexture(textureKey);

        if (texture) {
          terrainDetailTextureCache.drawBody(ctx, textureKey, objX, objY, scale);

          if (obj.getFlashTimer() > 0) {
            const flashAlpha = obj.getFlashTimer() / 0.1;
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = flashAlpha;
            terrainDetailTextureCache.drawBody(ctx, textureKey, objX, objY, scale);
            ctx.restore();
          }
        } else {
          obj.drawBody(ctx);
        }

        obj.drawLabel(ctx);
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

    ctx.imageSmoothingEnabled = false;

    this.renderBodyPass(ctx, startX, endX, startY, endY, false);
    this.renderShadowPass(ctx, startX, endX, startY, endY, true);
    this.renderBodyPass(ctx, startX, endX, startY, endY, true);
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
    this.treeDestructionParticles.draw(
      ctx,
      cameraX,
      cameraY,
      viewportWidth,
      viewportHeight
    );
  }

  public drawDecorations(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.mushroomDecorations.draw(ctx, cameraX, cameraY, canvasWidth, canvasHeight);
  }

  public getDetailObjectsByPosition(): (TerrainDetailObject | null)[][] {
    return this.detailObjectsByPosition;
  }

  public onDetailDeleted(callback: () => void): void {
    this.onDetailDeletedCallbacks.push(callback);
  }
}
