import { getConnection } from "../spacetimedb-connection";
import { TANK_COLLISION_RADIUS } from "../constants";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import ProjectileRow from "../../module_bindings/projectile_type";
import TraversibilityMapRow from "../../module_bindings/traversibility_map_table";
import GameRow from "../../module_bindings/game_type";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import type { Projectile } from "../objects/projectiles";
import type { TankManager } from "./TankManager";
import { byteArrayToBoolArray } from "../utils/bitPacking";

export class HomeGameCollisionHandler {
  private gameId: string;
  private tankManager: TankManager | null = null;
  private isHomeGame: boolean = false;
  private traversibilityMap: boolean[] | null = null;
  private gameWidth: number = 0;
  private gameHeight: number = 0;
  private pendingCollisions: Set<bigint> = new Set();
  private clientSpawnTimes: Map<bigint, number> = new Map();
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
    return this.isHomeGame;
  }

  public hasPendingCollision(projectileId: bigint): boolean {
    return this.pendingCollisions.has(projectileId);
  }

  public clearPendingCollision(projectileId: bigint) {
    this.pendingCollisions.delete(projectileId);
    this.clientSpawnTimes.delete(projectileId);
  }

  public registerProjectile(projectileId: bigint) {
    if (this.isHomeGame && !this.clientSpawnTimes.has(projectileId)) {
      this.clientSpawnTimes.set(projectileId, performance.now());
    }
  }

  private subscribeToGameAndTraversibility() {
    const connection = getConnection();
    if (!connection) return;

    this.gameSubscription = subscribeToTable({
      table: connection.db.game,
      handlers: {
        onInsert: (_ctx: EventContext, game: Infer<typeof GameRow>) => {
          if (game.id !== this.gameId) return;
          this.isHomeGame = game.isHomeGame;
          this.gameWidth = game.width;
          this.gameHeight = game.height;
        },
        onUpdate: (_ctx: EventContext, _oldGame: Infer<typeof GameRow>, newGame: Infer<typeof GameRow>) => {
          if (newGame.id !== this.gameId) return;
          this.isHomeGame = newGame.isHomeGame;
          this.gameWidth = newGame.width;
          this.gameHeight = newGame.height;
        }
      },
      loadInitialData: false
    });

    const cachedGame = connection.db.game.Id.find(this.gameId);
    if (cachedGame) {
      this.isHomeGame = cachedGame.isHomeGame;
      this.gameWidth = cachedGame.width;
      this.gameHeight = cachedGame.height;
    }

    this.traversibilityMapSubscription = subscribeToTable({
      table: connection.db.traversibilityMap,
      handlers: {
        onInsert: (_ctx: EventContext, map: Infer<typeof TraversibilityMapRow>) => {
          if (map.gameId !== this.gameId) return;
          this.traversibilityMap = byteArrayToBoolArray(new Uint8Array(map.map), map.width * map.height);
          this.gameWidth = map.width;
          this.gameHeight = map.height;
        },
        onUpdate: (_ctx: EventContext, _oldMap: Infer<typeof TraversibilityMapRow>, newMap: Infer<typeof TraversibilityMapRow>) => {
          if (newMap.gameId !== this.gameId) return;
          this.traversibilityMap = byteArrayToBoolArray(new Uint8Array(newMap.map), newMap.width * newMap.height);
          this.gameWidth = newMap.width;
          this.gameHeight = newMap.height;
        }
      },
      loadInitialData: false
    });

    const cachedMap = connection.db.traversibilityMap.gameId.find(this.gameId);
    if (cachedMap) {
      this.traversibilityMap = byteArrayToBoolArray(new Uint8Array(cachedMap.map), cachedMap.width * cachedMap.height);
      this.gameWidth = cachedMap.width;
      this.gameHeight = cachedMap.height;
    }
  }

  public checkCollisions(projectileId: bigint, projectile: Projectile) {
    if (!this.isHomeGame) return;
    if (this.pendingCollisions.has(projectileId)) return;

    const projectileData = getConnection()?.db.projectile.id.find(projectileId);
    if (!projectileData) return;

    const spawnTimeMs = this.clientSpawnTimes.get(projectileId);
    if (spawnTimeMs !== undefined) {
      const projectileAgeSeconds = (performance.now() - spawnTimeMs) / 1000;
      if (projectileAgeSeconds >= projectileData.lifetimeSeconds) {
        this.handleProjectileExpire(projectileId);
        return;
      }
    }

    const x = projectile.getX();
    const y = projectile.getY();

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
    if (!this.traversibilityMap || this.gameWidth === 0 || this.gameHeight === 0) {
      return null;
    }

    const gridX = Math.floor(x);
    const gridY = Math.floor(y);

    if (gridX < 0 || gridX >= this.gameWidth || gridY < 0 || gridY >= this.gameHeight) {
      return null;
    }

    const tileIndex = gridY * this.gameWidth + gridX;
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
    getConnection()?.reducers.homegameProjectileExpire({ projectileId });
  }

  private handleTerrainCollision(projectileId: bigint, gridX: number, gridY: number) {
    this.pendingCollisions.add(projectileId);
    getConnection()?.reducers.homegameProjectileTerrainHit({ projectileId, gridX, gridY });
  }

  private handleTankCollision(projectileId: bigint, targetTankId: string) {
    this.pendingCollisions.add(projectileId);
    getConnection()?.reducers.homegameProjectileTankHit({ projectileId, targetTankId });
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
    this.clientSpawnTimes.clear();
  }
}
