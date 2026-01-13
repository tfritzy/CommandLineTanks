import { Projectile, ProjectileFactory } from "../objects/projectiles";
import { getConnection } from "../spacetimedb-connection";
import { ProjectileImpactParticlesManager } from "./ProjectileImpactParticlesManager";
import { projectileTextureCache } from "../textures";
import { UNIT_TO_PIXEL } from "../constants";
import type { TankManager } from "./TankManager";
import { ScreenShake } from "../utils/ScreenShake";
import { SoundManager } from "./SoundManager";
import { HomeWorldCollisionHandler } from "./HomeWorldCollisionHandler";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import ProjectileRow from "../../module_bindings/projectile_type";
import ProjectileTransformRow from "../../module_bindings/projectile_transform_type";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

export class ProjectileManager {
  private projectiles: Map<bigint, Projectile> = new Map();
  private gameId: string;
  private particlesManager: ProjectileImpactParticlesManager;
  private tankManager: TankManager | null = null;
  private screenShake: ScreenShake;
  private soundManager: SoundManager;
  private projectileSubscription: TableSubscription<typeof ProjectileRow> | null = null;
  private transformSubscription: TableSubscription<typeof ProjectileTransformRow> | null = null;
  private homeWorldCollisionHandler: HomeWorldCollisionHandler;

  constructor(gameId: string, screenShake: ScreenShake, soundManager: SoundManager) {
    this.gameId = gameId;
    this.particlesManager = new ProjectileImpactParticlesManager();
    this.screenShake = screenShake;
    this.soundManager = soundManager;
    this.homeWorldCollisionHandler = new HomeWorldCollisionHandler(gameId);
    this.subscribeToProjectiles();
  }

  public setTankManager(tankManager: TankManager) {
    this.tankManager = tankManager;
    this.homeWorldCollisionHandler.setTankManager(tankManager);
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

          const playerTank = this.tankManager?.getPlayerTank();
          if (playerTank && newProjectile.shooterTankId === playerTank.id && newProjectile.projectileType.tag === "Moag") {
            this.screenShake.shake(15, 0.3);
          }
        },
        onUpdate: () => {},
        onDelete: (_ctx: EventContext, projectile: Infer<typeof ProjectileRow>) => {
          if (projectile.gameId !== this.gameId) return;
          this.projectiles.delete(projectile.id);
          this.homeWorldCollisionHandler.clearPendingCollision(projectile.id);
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
            this.homeWorldCollisionHandler.clearPendingCollision(transform.projectileId);
          }
        }
      }
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
    this.homeWorldCollisionHandler.destroy();
    this.projectiles.clear();
    this.particlesManager.destroy();
  }

  public update(deltaTime: number) {
    const isHomeWorld = this.homeWorldCollisionHandler.isEnabled();
    const connection = isHomeWorld ? getConnection() : null;
    
    for (const [projectileId, projectile] of this.projectiles.entries()) {
      projectile.update(deltaTime, this.tankManager ?? undefined);
      
      if (isHomeWorld && connection) {
        const projectileData = connection.db.projectile.id.find(projectileId);
        if (projectileData) {
          this.homeWorldCollisionHandler.checkCollisions(projectileId, projectile, projectileData);
        }
      }
    }
    this.particlesManager.update(deltaTime);
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
