import { getConnection } from "../spacetimedb-connection";
import { TANK_COLLISION_RADIUS } from "../constants";
import { ServerTimeSync } from "../utils/ServerTimeSync";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import ProjectileRow from "../../module_bindings/projectile_type";
import TraversibilityMapRow from "../../module_bindings/traversibility_map_table";
import GameRow from "../../module_bindings/game_type";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import type { Projectile } from "../objects/projectiles";
import type { TankManager } from "./TankManager";

export class HomeWorldCollisionHandler {
  private gameId: string;
  private tankManager: TankManager | null = null;
  private isHomeWorld: boolean = false;
  private traversibilityMap: boolean[] | null = null;
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private pendingCollisions: Set<bigint> = new Set();
  private traversibilityMapSubscription: TableSubscription<typeof TraversibilityMapRow> | null = null;
  private gameSubscription: TableSubscription<typeof GameRow> | null = null;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.subscribeToGameAndTraversibility();
  }

  public setTankManager(tankManager: TankManager) {
    this.tankManager = tankManager;
  }

  public isEnabled(): boolean {
    return this.isHomeWorld;
  }

  public hasPendingCollision(projectileId: bigint): boolean {
    return this.pendingCollisions.has(projectileId);
  }

  public clearPendingCollision(projectileId: bigint) {
    this.pendingCollisions.delete(projectileId);
  }

  private subscribeToGameAndTraversibility() {
    const connection = getConnection();
    if (!connection) return;

    this.gameSubscription = subscribeToTable({
      table: connection.db.game,
      handlers: {
        onInsert: (_ctx: EventContext, game: Infer<typeof GameRow>) => {
          if (game.id !== this.gameId) return;
          this.isHomeWorld = game.isHomeGame;
          this.worldWidth = game.width;
          this.worldHeight = game.height;
        },
        onUpdate: (_ctx: EventContext, _oldGame: Infer<typeof GameRow>, newGame: Infer<typeof GameRow>) => {
          if (newGame.id !== this.gameId) return;
          this.isHomeWorld = newGame.isHomeGame;
          this.worldWidth = newGame.width;
          this.worldHeight = newGame.height;
        }
      },
      loadInitialData: false
    });

    const cachedGame = connection.db.game.Id.find(this.gameId);
    if (cachedGame) {
      this.isHomeWorld = cachedGame.isHomeGame;
      this.worldWidth = cachedGame.width;
      this.worldHeight = cachedGame.height;
    }

    this.traversibilityMapSubscription = subscribeToTable({
      table: connection.db.traversibilityMap,
      handlers: {
        onInsert: (_ctx: EventContext, map: Infer<typeof TraversibilityMapRow>) => {
          if (map.gameId !== this.gameId) return;
          this.traversibilityMap = [...map.map];
          this.worldWidth = map.width;
          this.worldHeight = map.height;
        },
        onUpdate: (_ctx: EventContext, _oldMap: Infer<typeof TraversibilityMapRow>, newMap: Infer<typeof TraversibilityMapRow>) => {
          if (newMap.gameId !== this.gameId) return;
          this.traversibilityMap = [...newMap.map];
          this.worldWidth = newMap.width;
          this.worldHeight = newMap.height;
        }
      },
      loadInitialData: false
    });

    const cachedMap = connection.db.traversibilityMap.gameId.find(this.gameId);
    if (cachedMap) {
      this.traversibilityMap = [...cachedMap.map];
      this.worldWidth = cachedMap.width;
      this.worldHeight = cachedMap.height;
    }
  }

  public checkCollisions(projectileId: bigint, projectile: Projectile, projectileData: Infer<typeof ProjectileRow>) {
    if (!this.isHomeWorld) return;
    if (this.pendingCollisions.has(projectileId)) return;

    const x = projectile.getX();
    const y = projectile.getY();
    const currentTimeMs = ServerTimeSync.getInstance().getServerTime();
    const spawnedAtMs = Number(projectileData.spawnedAt) / 1000;
    const projectileAgeSeconds = (currentTimeMs - spawnedAtMs) / 1000;

    if (projectileAgeSeconds >= projectileData.lifetimeSeconds) {
      this.handleProjectileExpire(projectileId);
      return;
    }

    if (!projectileData.passThroughTerrain) {
      const terrainCollision = this.checkTerrainCollision(x, y, projectileData);
      if (terrainCollision) {
        this.handleTerrainCollision(projectileId, terrainCollision.gridX, terrainCollision.gridY);
        return;
      }
    }

    const tankHit = this.checkTankCollision(x, y, projectileData);
    if (tankHit) {
      this.handleTankCollision(projectileId, tankHit);
    }
  }

  private checkTerrainCollision(x: number, y: number, data: Infer<typeof ProjectileRow>): { gridX: number; gridY: number } | null {
    if (!this.traversibilityMap || this.worldWidth === 0 || this.worldHeight === 0) {
      return null;
    }

    const gridX = Math.floor(x);
    const gridY = Math.floor(y);

    if (gridX < 0 || gridX >= this.worldWidth || gridY < 0 || gridY >= this.worldHeight) {
      return null;
    }

    const tileIndex = gridY * this.worldWidth + gridX;
    const isTraversable = tileIndex < this.traversibilityMap.length && this.traversibilityMap[tileIndex];

    if (isTraversable) {
      return null;
    }

    if (data.bounce) {
      return null;
    }

    return { gridX, gridY };
  }

  private checkTankCollision(x: number, y: number, data: Infer<typeof ProjectileRow>): string | null {
    if (!this.tankManager) return null;

    const collisionRadius = data.collisionRadius + TANK_COLLISION_RADIUS;
    const collisionRadiusSquared = collisionRadius * collisionRadius;

    for (const tank of this.tankManager.getAllTanks()) {
      const tankPos = tank.getPosition();
      const tankHealth = tank.getHealth();
      const tankAlliance = tank.getAlliance();

      if (tankHealth <= 0) continue;
      if (tankAlliance === data.alliance) continue;

      if (data.returnsToShooter && data.isReturning && tank.id === data.shooterTankId) {
        return tank.id;
      }

      const dx = tankPos.x - x;
      const dy = tankPos.y - y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared <= collisionRadiusSquared) {
        return tank.id;
      }
    }

    return null;
  }

  private handleProjectileExpire(projectileId: bigint) {
    this.pendingCollisions.add(projectileId);
    getConnection()?.reducers.homeWorldProjectileExpire({ projectileId });
  }

  private handleTerrainCollision(projectileId: bigint, gridX: number, gridY: number) {
    this.pendingCollisions.add(projectileId);
    getConnection()?.reducers.homeWorldProjectileTerrainHit({ projectileId, gridX, gridY });
  }

  private handleTankCollision(projectileId: bigint, targetTankId: string) {
    this.pendingCollisions.add(projectileId);
    getConnection()?.reducers.homeWorldProjectileTankHit({ projectileId, targetTankId });
  }

  public destroy() {
    if (this.traversibilityMapSubscription) {
      this.traversibilityMapSubscription.unsubscribe();
      this.traversibilityMapSubscription = null;
    }
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
      this.gameSubscription = null;
    }
    this.pendingCollisions.clear();
  }
}
