import { Projectile, ProjectileFactory } from "../objects/projectiles";
import { getConnection } from "../spacetimedb-connection";
import { ProjectileImpactParticlesManager } from "./ProjectileImpactParticlesManager";
import { projectileTextureSheet } from "../texture-sheets/ProjectileTextureSheet";
import { UNIT_TO_PIXEL } from "../constants";
import type { TankManager } from "./TankManager";
import { ScreenShake } from "../utils/ScreenShake";
import type { SubscriptionHandle, EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import ProjectileRow from "../../module_bindings/projectile_type";

export class ProjectileManager {
  private projectiles: Map<string, Projectile> = new Map();
  private worldId: string;
  private particlesManager: ProjectileImpactParticlesManager;
  private tankManager: TankManager | null = null;
  private screenShake: ScreenShake;
  private subscriptionHandle: SubscriptionHandle | null = null;
  private handleProjectileUpdate: ((ctx: EventContext, oldProjectile: Infer<typeof ProjectileRow>, newProjectile: Infer<typeof ProjectileRow>) => void) | null = null;
  private handleProjectileDelete: ((ctx: EventContext, projectile: Infer<typeof ProjectileRow>) => void) | null = null;

  constructor(worldId: string, screenShake: ScreenShake) {
    this.worldId = worldId;
    this.particlesManager = new ProjectileImpactParticlesManager();
    this.screenShake = screenShake;
    this.subscribeToProjectiles();
  }

  public setTankManager(tankManager: TankManager) {
    this.tankManager = tankManager;
  }

  private subscribeToProjectiles() {
    const connection = getConnection();
    if (!connection) return;

    this.subscriptionHandle = connection
      .subscriptionBuilder()
      .onError((e) => console.log("Projectile subscription error", e))
      .subscribe([
        `SELECT * FROM projectile WHERE WorldId = '${this.worldId}'`,
      ]);

    this.handleProjectileUpdate = (_ctx: EventContext, _oldProjectile: Infer<typeof ProjectileRow>, newProjectile: Infer<typeof ProjectileRow>) => {
      if (newProjectile.worldId !== this.worldId) return;
      let projectile = this.projectiles.get(newProjectile.id);
      if (!projectile) {
        projectile = ProjectileFactory.create(
          newProjectile.projectileType.tag,
          newProjectile.positionX,
          newProjectile.positionY,
          newProjectile.velocity.x,
          newProjectile.velocity.y,
          newProjectile.size,
          newProjectile.alliance,
          newProjectile.explosionRadius,
          newProjectile.trackingStrength,
          newProjectile.trackingRadius
        );
        this.projectiles.set(newProjectile.id, projectile);

        const playerTank = this.tankManager?.getPlayerTank();
        if (playerTank && newProjectile.shooterTankId === playerTank.id && newProjectile.projectileType.tag === "Moag") {
          this.screenShake.shake(15, 0.3);
        }
      }

      if (projectile) {
        projectile.setPosition(
          newProjectile.positionX,
          newProjectile.positionY,
          newProjectile.updatedAt
        );
        projectile.setVelocity(
          newProjectile.velocity.x,
          newProjectile.velocity.y
        );
      }
    };

    this.handleProjectileDelete = (_ctx: EventContext, projectile: Infer<typeof ProjectileRow>) => {
      if (projectile.worldId !== this.worldId) return;
      const localProjectile = this.projectiles.get(projectile.id);
      if (localProjectile) {
        localProjectile.spawnDeathParticles(this.particlesManager);
      }
      this.projectiles.delete(projectile.id);
    };

    connection.db.projectile.onUpdate(this.handleProjectileUpdate);
    connection.db.projectile.onDelete(this.handleProjectileDelete);

    for (const projectile of connection.db.projectile.iter()) {
      if (projectile.worldId === this.worldId) {
        const localProjectile = ProjectileFactory.create(
          projectile.projectileType.tag,
          projectile.positionX,
          projectile.positionY,
          projectile.velocity.x,
          projectile.velocity.y,
          projectile.size,
          projectile.alliance,
          projectile.explosionRadius,
          projectile.trackingStrength,
          projectile.trackingRadius
        );
        this.projectiles.set(projectile.id, localProjectile);
      }
    }
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleProjectileUpdate) connection.db.projectile.removeOnUpdate(this.handleProjectileUpdate);
      if (this.handleProjectileDelete) connection.db.projectile.removeOnDelete(this.handleProjectileDelete);
    }

    if (this.subscriptionHandle) {
      this.subscriptionHandle.unsubscribe();
    }
  }

  public update(deltaTime: number) {
    for (const projectile of this.projectiles.values()) {
      projectile.update(deltaTime, this.tankManager ?? undefined);
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

      projectile.drawShadow(ctx, projectileTextureSheet);
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

      projectile.drawBody(ctx, projectileTextureSheet);
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
