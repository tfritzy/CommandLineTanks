import { Projectile, ProjectileFactory } from "../objects/projectiles";
import { getConnection } from "../spacetimedb-connection";
import { ProjectileImpactParticlesManager } from "./ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "./ProjectileTextureSheet";
import { UNIT_TO_PIXEL } from "../game";

export class ProjectileManager {
  private projectiles: Map<string, Projectile> = new Map();
  private worldId: string;
  private particlesManager: ProjectileImpactParticlesManager;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.particlesManager = new ProjectileImpactParticlesManager();
    this.subscribeToProjectiles();
  }

  private subscribeToProjectiles() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Projectile subscription error", e))
      .subscribe([
        `SELECT * FROM projectile WHERE WorldId = '${this.worldId}'`,
      ]);

    connection.db.projectile.onUpdate((_ctx, _oldProjectile, newProjectile) => {
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
          newProjectile.explosionRadius
        );
        this.projectiles.set(newProjectile.id, projectile);
      }

      if (projectile) {
        projectile.setPosition(
          newProjectile.positionX,
          newProjectile.positionY
        );
        projectile.setVelocity(
          newProjectile.velocity.x,
          newProjectile.velocity.y
        );
      }
    });

    connection.db.projectile.onDelete((_ctx, projectile) => {
      const localProjectile = this.projectiles.get(projectile.id);
      if (localProjectile) {
        localProjectile.spawnDeathParticles(this.particlesManager);
      }
      this.projectiles.delete(projectile.id);
    });
  }

  public update(deltaTime: number) {
    for (const projectile of this.projectiles.values()) {
      projectile.update(deltaTime);
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
    const textureSheet = ProjectileTextureSheet.getInstance();
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

      projectile.drawShadow(ctx, textureSheet);
    }
  }

  public drawBodies(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const textureSheet = ProjectileTextureSheet.getInstance();
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

      projectile.drawBody(ctx, textureSheet);
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
