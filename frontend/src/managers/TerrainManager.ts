import { getConnection } from "../spacetimedb-connection";
import { TerrainDetailManager } from "./TerrainDetailManager";
import { SoundManager } from "./SoundManager";
import { type EventContext, BaseTerrain } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import GameRow from "../../module_bindings/game_type";
import BaseTerrainLayerRow from "../../module_bindings/base_terrain_layer_type";
import { UNIT_TO_PIXEL } from "../constants";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import { drawBaseTerrain } from "../drawing/terrain/base-terrain";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export class TerrainManager {
  private detailManager: TerrainDetailManager | null = null;
  private gameId: string;
  private gameWidth: number = 0;
  private gameHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private soundManager: SoundManager;
  private gameSubscription: TableSubscription<typeof GameRow> | null = null;
  private terrainSubscription: TableSubscription<typeof BaseTerrainLayerRow> | null = null;

  constructor(gameId: string, soundManager: SoundManager) {
    this.gameId = gameId;
    this.soundManager = soundManager;
    this.subscribeToGameForDetails();
    this.subscribeToBaseTerrainLayer();
  }

  private subscribeToGameForDetails() {
    const connection = getConnection();
    if (!connection) return;

    const handleGameChange = (game: Infer<typeof GameRow>) => {
      if (game.id !== this.gameId) return;
      this.gameWidth = game.width;
      this.gameHeight = game.height;

      if (!this.detailManager) {
        this.detailManager = new TerrainDetailManager(
          this.gameId,
          game.width,
          game.height,
          this.soundManager,
          this.baseTerrainLayer
        );
      } else {
        this.detailManager.updateGameDimensions(game.width, game.height);
        this.detailManager.updateBaseTerrainLayer(this.baseTerrainLayer);
      }
    };

    this.gameSubscription = subscribeToTable({
      table: connection.db.game,
      handlers: {
        onInsert: (_ctx: EventContext, game: Infer<typeof GameRow>) => {
          handleGameChange(game);
        },
        onUpdate: (_ctx: EventContext, _oldGame: Infer<typeof GameRow>, newGame: Infer<typeof GameRow>) => {
          handleGameChange(newGame);
        }
      },
      loadInitialData: false
    });

    const cachedGame = connection.db.game.Id.find(this.gameId);
    if (cachedGame) {
      handleGameChange(cachedGame);
    }
  }

  private subscribeToBaseTerrainLayer() {
    const connection = getConnection();
    if (!connection) return;

    const handleTerrainChange = (terrain: Infer<typeof BaseTerrainLayerRow>) => {
      if (terrain.gameId !== this.gameId) return;
      this.baseTerrainLayer = terrain.layer;

      if (this.detailManager) {
        this.detailManager.updateBaseTerrainLayer(this.baseTerrainLayer);
      }
    };

    this.terrainSubscription = subscribeToTable({
      table: connection.db.baseTerrainLayer,
      handlers: {
        onInsert: (_ctx: EventContext, terrain: Infer<typeof BaseTerrainLayerRow>) => {
          handleTerrainChange(terrain);
        },
        onUpdate: (_ctx: EventContext, _oldTerrain: Infer<typeof BaseTerrainLayerRow>, newTerrain: Infer<typeof BaseTerrainLayerRow>) => {
          handleTerrainChange(newTerrain);
        }
      },
      loadInitialData: false
    });

    const cachedTerrain = connection.db.baseTerrainLayer.GameId.find(this.gameId);
    if (cachedTerrain) {
      handleTerrainChange(cachedTerrain);
    }
  }

  public destroy() {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
      this.gameSubscription = null;
    }
    if (this.terrainSubscription) {
      this.terrainSubscription.unsubscribe();
      this.terrainSubscription = null;
    }
    if (this.detailManager) {
      this.detailManager.destroy();
    }
  }

  public update(deltaTime: number) {
    if (this.detailManager) {
      this.detailManager.update(deltaTime);
    }
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.baseTerrainLayer.length === 0) return;

    const startTileX = Math.floor(cameraX / UNIT_TO_PIXEL);
    const endTileX = Math.ceil((cameraX + canvasWidth) / UNIT_TO_PIXEL);
    const startTileY = Math.floor(cameraY / UNIT_TO_PIXEL);
    const endTileY = Math.ceil((cameraY + canvasHeight) / UNIT_TO_PIXEL);

    drawBaseTerrain(
      ctx,
      this.baseTerrainLayer,
      this.gameWidth,
      this.gameHeight,
      startTileX,
      endTileX,
      startTileY,
      endTileY
    );
  }

  public drawShadows(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.detailManager) {
      this.detailManager.drawShadows(
        ctx,
        cameraX,
        cameraY,
        canvasWidth,
        canvasHeight
      );
    }
  }

  public drawBodies(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.detailManager) {
      this.detailManager.drawBodies(
        ctx,
        cameraX,
        cameraY,
        canvasWidth,
        canvasHeight
      );
    }
  }

  public drawParticles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    if (this.detailManager) {
      this.detailManager.drawParticles(
        ctx,
        cameraX,
        cameraY,
        viewportWidth,
        viewportHeight
      );
    }
  }

  public drawDecorations(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.detailManager) {
      this.detailManager.drawDecorations(
        ctx,
        cameraX,
        cameraY,
        canvasWidth,
        canvasHeight
      );
    }
  }

  public getGameWidth(): number {
    return this.gameWidth;
  }

  public getGameHeight(): number {
    return this.gameHeight;
  }

  public getBaseTerrainLayer() {
    return this.baseTerrainLayer;
  }

  public getTerrainDetailsByPosition() {
    return this.detailManager?.getDetailObjectsByPosition() ?? null;
  }

  public onTerrainDetailDeleted(callback: () => void): void {
    if (this.detailManager) {
      this.detailManager.onDetailDeleted(callback);
    }
  }
}
