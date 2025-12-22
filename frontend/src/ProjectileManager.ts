import { Projectile, ProjectileFactory } from "./objects/projectiles";
import { getConnection } from "./spacetimedb-connection";
import { ProjectileImpactParticlesManager } from "./ProjectileImpactParticlesManager";

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
      .subscribe([`SELECT * FROM projectile WHERE WorldId = '${this.worldId}'`]);

    connection.db.projectile.onInsert((_ctx, projectile) => {
      const newProjectile = ProjectileFactory.create(
        projectile.projectileType.tag,
        projectile.positionX,
        projectile.positionY,
        projectile.velocity.x,
        projectile.velocity.y,
        projectile.size,
        projectile.alliance,
        projectile.explosionRadius
      );
      this.projectiles.set(projectile.id, newProjectile);
    });

    connection.db.projectile.onUpdate((_ctx, _oldProjectile, newProjectile) => {
      const projectile = this.projectiles.get(newProjectile.id);
      if (projectile) {
        projectile.setPosition(newProjectile.positionX, newProjectile.positionY);
        projectile.setVelocity(newProjectile.velocity.x, newProjectile.velocity.y);
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

  public drawShadows(ctx: CanvasRenderingContext2D) {
    for (const projectile of this.projectiles.values()) {
      projectile.drawShadow(ctx);
    }
  }

  public drawBodies(ctx: CanvasRenderingContext2D) {
    for (const projectile of this.projectiles.values()) {
      projectile.drawBody(ctx);
    }
    this.particlesManager.draw(ctx);
  }

  public getAllProjectiles(): IterableIterator<Projectile> {
    return this.projectiles.values();
  }
}
