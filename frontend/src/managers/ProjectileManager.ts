import { Projectile, ProjectileFactory } from "../objects/projectiles";
import { getConnection } from "../spacetimedb-connection";
import { ProjectileImpactParticlesManager } from "./ProjectileImpactParticlesManager";
import { projectileTextureCache } from "../textures";
import { UNIT_TO_PIXEL, TANK_COLLISION_RADIUS } from "../constants";
import type { TankManager } from "./TankManager";
import { ScreenShake } from "../utils/ScreenShake";
import { SoundManager } from "./SoundManager";
import { ServerTimeSync } from "../utils/ServerTimeSync";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import ProjectileRow from "../../module_bindings/projectile_type";
import ProjectileTransformRow from "../../module_bindings/projectile_transform_type";
import TraversibilityMapRow from "../../module_bindings/traversibility_map_table";
import GameRow from "../../module_bindings/game_type";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

interface ProjectileData {
  id: bigint;
  shooterTankId: string;
  alliance: number;
  size: number;
  damage: number;
  lifetimeSeconds: number;
  spawnedAt: bigint;
  maxCollisions: number;
  passThroughTerrain: boolean;
  collisionRadius: number;
  explosionRadius: number | undefined;
  explosionTrigger: string;
  returnsToShooter: boolean;
  isReturning: boolean;
  bounce: boolean;
}

export class ProjectileManager {
  private projectiles: Map<bigint, Projectile> = new Map();
  private projectileData: Map<bigint, ProjectileData> = new Map();
  private gameId: string;
  private particlesManager: ProjectileImpactParticlesManager;
  private tankManager: TankManager | null = null;
  private screenShake: ScreenShake;
  private soundManager: SoundManager;
  private projectileSubscription: TableSubscription<typeof ProjectileRow> | null = null;
  private transformSubscription: TableSubscription<typeof ProjectileTransformRow> | null = null;
  private traversibilityMapSubscription: TableSubscription<typeof TraversibilityMapRow> | null = null;
  private gameSubscription: TableSubscription<typeof GameRow> | null = null;
  private isHomeWorld: boolean = false;
  private traversibilityMap: boolean[] | null = null;
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private pendingCollisions: Set<bigint> = new Set();

  constructor(gameId: string, screenShake: ScreenShake, soundManager: SoundManager) {
    this.gameId = gameId;
    this.particlesManager = new ProjectileImpactParticlesManager();
    this.screenShake = screenShake;
    this.soundManager = soundManager;
    this.subscribeToProjectiles();
    this.subscribeToGameAndTraversibility();
  }

  public setTankManager(tankManager: TankManager) {
    this.tankManager = tankManager;
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

  private subscribeToProjectiles() {
    const connection = getConnection();
    if (!connection) return;

    this.projectileSubscription = subscribeToTable({
      table: connection.db.projectile,
      handlers: {
        onInsert: (_ctx: EventContext, newProjectile: Infer<typeof ProjectileRow>) => {
          if (newProjectile.gameId !== this.gameId) return;

          if (this.projectiles.has(newProjectile.id)) return;

          const transform = connection.db.projectileTransform.projectileId.find(newProjectile.id);
          if (!transform) return;

          const projectile = ProjectileFactory.create(
            newProjectile.projectileType.tag,
            transform.positionX,
            transform.positionY,
            transform.velocity.x,
            transform.velocity.y,
            newProjectile.size,
            newProjectile.alliance,
            newProjectile.shooterTankId,
            newProjectile.explosionRadius,
            newProjectile.trackingStrength,
            newProjectile.trackingRadius
          );
          this.projectiles.set(newProjectile.id, projectile);
          this.storeProjectileData(newProjectile);

          const playerTank = this.tankManager?.getPlayerTank();
          if (playerTank && newProjectile.shooterTankId === playerTank.id && newProjectile.projectileType.tag === "Moag") {
            this.screenShake.shake(15, 0.3);
          }
        },
        onUpdate: () => {},
        onDelete: (_ctx: EventContext, projectile: Infer<typeof ProjectileRow>) => {
          if (projectile.gameId !== this.gameId) return;
          this.projectiles.delete(projectile.id);
          this.projectileData.delete(projectile.id);
          this.pendingCollisions.delete(projectile.id);
        }
      }
    });

    this.transformSubscription = subscribeToTable({
      table: connection.db.projectileTransform,
      handlers: {
        onInsert: (_ctx: EventContext, newTransform: Infer<typeof ProjectileTransformRow>) => {
          if (this.projectiles.has(newTransform.projectileId)) return;

          const projectileData = connection.db.projectile.id.find(newTransform.projectileId);
          if (!projectileData) return;
          if (projectileData.gameId !== this.gameId) return;

          const projectile = ProjectileFactory.create(
            projectileData.projectileType.tag,
            newTransform.positionX,
            newTransform.positionY,
            newTransform.velocity.x,
            newTransform.velocity.y,
            projectileData.size,
            projectileData.alliance,
            projectileData.shooterTankId,
            projectileData.explosionRadius,
            projectileData.trackingStrength,
            projectileData.trackingRadius
          );
          this.projectiles.set(newTransform.projectileId, projectile);
          this.storeProjectileData(projectileData);

          const playerTank = this.tankManager?.getPlayerTank();
          if (playerTank && projectileData.shooterTankId === playerTank.id && projectileData.projectileType.tag === "Moag") {
            this.screenShake.shake(15, 0.3);
          }
        },
        onUpdate: (_ctx: EventContext, _oldTransform: Infer<typeof ProjectileTransformRow>, newTransform: Infer<typeof ProjectileTransformRow>) => {
          const projectile = this.projectiles.get(newTransform.projectileId);

          if (projectile) {
            projectile.setPosition(
              newTransform.positionX,
              newTransform.positionY
            );
            projectile.setVelocity(
              newTransform.velocity.x,
              newTransform.velocity.y
            );
          }
        },
        onDelete: (_ctx: EventContext, transform: Infer<typeof ProjectileTransformRow>) => {
          const localProjectile = this.projectiles.get(transform.projectileId);
          if (localProjectile) {
            localProjectile.spawnDeathParticles(this.particlesManager);
            this.soundManager.play("projectile-hit", 0.3, transform.positionX, transform.positionY);
            this.projectiles.delete(transform.projectileId);
            this.projectileData.delete(transform.projectileId);
            this.pendingCollisions.delete(transform.projectileId);
          }
        }
      }
    });
  }

  private storeProjectileData(p: Infer<typeof ProjectileRow>) {
    this.projectileData.set(p.id, {
      id: p.id,
      shooterTankId: p.shooterTankId,
      alliance: p.alliance,
      size: p.size,
      damage: p.damage,
      lifetimeSeconds: p.lifetimeSeconds,
      spawnedAt: p.spawnedAt,
      maxCollisions: p.maxCollisions,
      passThroughTerrain: p.passThroughTerrain,
      collisionRadius: p.collisionRadius,
      explosionRadius: p.explosionRadius ?? undefined,
      explosionTrigger: p.explosionTrigger.tag,
      returnsToShooter: p.returnsToShooter,
      isReturning: p.isReturning,
      bounce: p.bounce
    });
  }

  public destroy() {
    if (this.projectileSubscription) {
      this.projectileSubscription.unsubscribe();
      this.projectileSubscription = null;
    }
    if (this.transformSubscription) {
      this.transformSubscription.unsubscribe();
      this.transformSubscription = null;
    }
    if (this.traversibilityMapSubscription) {
      this.traversibilityMapSubscription.unsubscribe();
      this.traversibilityMapSubscription = null;
    }
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
      this.gameSubscription = null;
    }
    this.projectiles.clear();
    this.projectileData.clear();
    this.pendingCollisions.clear();
    this.particlesManager.destroy();
  }

  public update(deltaTime: number) {
    for (const [projectileId, projectile] of this.projectiles.entries()) {
      projectile.update(deltaTime, this.tankManager ?? undefined);
      
      if (this.isHomeWorld) {
        this.checkHomeWorldCollisions(projectileId, projectile);
      }
    }
    this.particlesManager.update(deltaTime);
  }

  private checkHomeWorldCollisions(projectileId: bigint, projectile: Projectile) {
    if (this.pendingCollisions.has(projectileId)) return;

    const data = this.projectileData.get(projectileId);
    if (!data) return;

    const x = projectile.getX();
    const y = projectile.getY();
    const currentTimeMs = ServerTimeSync.getInstance().getServerTime();
    const spawnedAtMs = Number(data.spawnedAt) / 1000;
    const projectileAgeSeconds = (currentTimeMs - spawnedAtMs) / 1000;

    if (projectileAgeSeconds >= data.lifetimeSeconds) {
      this.handleProjectileExpire(projectileId);
      return;
    }

    if (!data.passThroughTerrain) {
      const terrainCollision = this.checkTerrainCollision(x, y, data);
      if (terrainCollision) {
        this.handleTerrainCollision(projectileId, terrainCollision.gridX, terrainCollision.gridY);
        return;
      }
    }

    const tankHit = this.checkTankCollision(x, y, data);
    if (tankHit) {
      this.handleTankCollision(projectileId, tankHit);
    }
  }

  private checkTerrainCollision(x: number, y: number, data: ProjectileData): { gridX: number; gridY: number } | null {
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

  private checkTankCollision(x: number, y: number, data: ProjectileData): string | null {
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
    
    const connection = getConnection();
    if (!connection) return;

    connection.reducers.homeWorldProjectileExpire({ projectileId });
  }

  private handleTerrainCollision(projectileId: bigint, gridX: number, gridY: number) {
    this.pendingCollisions.add(projectileId);
    
    const connection = getConnection();
    if (!connection) return;

    connection.reducers.homeWorldProjectileTerrainHit({ projectileId, gridX, gridY });
  }

  private handleTankCollision(projectileId: bigint, targetTankId: string) {
    this.pendingCollisions.add(projectileId);
    
    const connection = getConnection();
    if (!connection) return;

    connection.reducers.homeWorldProjectileTankHit({ projectileId, targetTankId });
  }

  private isOutOfBounds(
    x: number,
    y: number,
    size: number,
    cameraWorldX: number,
    cameraWorldY: number,
    viewportWorldWidth: number,
    viewportWorldHeight: number
  ): boolean {
    return (
      x + size < cameraWorldX ||
      x - size > cameraWorldX + viewportWorldWidth ||
      y + size < cameraWorldY ||
      y - size > cameraWorldY + viewportWorldHeight
    );
  }

  public drawShadows(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const cameraWorldX = cameraX / UNIT_TO_PIXEL;
    const cameraWorldY = cameraY / UNIT_TO_PIXEL;
    const viewportWorldWidth = viewportWidth / UNIT_TO_PIXEL;
    const viewportWorldHeight = viewportHeight / UNIT_TO_PIXEL;

    for (const projectile of this.projectiles.values()) {
      const x = projectile.getX();
      const y = projectile.getY();
      const size = projectile.getSize();

      if (
        this.isOutOfBounds(
          x,
          y,
          size,
          cameraWorldX,
          cameraWorldY,
          viewportWorldWidth,
          viewportWorldHeight
        )
      ) {
        continue;
      }

      projectile.drawShadow(ctx, projectileTextureCache);
    }
  }

  public drawBodies(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const cameraWorldX = cameraX / UNIT_TO_PIXEL;
    const cameraWorldY = cameraY / UNIT_TO_PIXEL;
    const viewportWorldWidth = viewportWidth / UNIT_TO_PIXEL;
    const viewportWorldHeight = viewportHeight / UNIT_TO_PIXEL;

    for (const projectile of this.projectiles.values()) {
      const x = projectile.getX();
      const y = projectile.getY();
      const size = projectile.getSize();

      if (
        this.isOutOfBounds(
          x,
          y,
          size,
          cameraWorldX,
          cameraWorldY,
          viewportWorldWidth,
          viewportWorldHeight
        )
      ) {
        continue;
      }

      projectile.drawBody(ctx, projectileTextureCache);
    }
    this.particlesManager.draw(
      ctx,
      cameraX,
      cameraY,
      viewportWidth,
      viewportHeight
    );
  }

  public getAllProjectiles(): IterableIterator<Projectile> {
    return this.projectiles.values();
  }
}
