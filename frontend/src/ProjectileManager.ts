import { Projectile } from "./objects/Projectile";
import { getConnection } from "./spacetimedb-connection";

export class ProjectileManager {
  private projectiles: Map<string, Projectile> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToProjectiles();
  }

  private subscribeToProjectiles() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Projectile subscription error", e))
      .subscribe([`SELECT * FROM projectile WHERE worldId = '${this.worldId}'`]);

    connection.db.projectile.onInsert((_ctx, projectile) => {
      console.log(projectile);
      const newProjectile = new Projectile(
        projectile.positionX,
        projectile.positionY,
        projectile.velocity.x,
        projectile.velocity.y,
        projectile.size,
        projectile.alliance
      );
      this.projectiles.set(projectile.id, newProjectile);
    });

    connection.db.projectile.onUpdate((_ctx, _oldProjectile, newProjectile) => {
      console.log(newProjectile);
      const projectile = this.projectiles.get(newProjectile.id);
      if (projectile) {
        projectile.setPosition(newProjectile.positionX, newProjectile.positionY);
        projectile.setVelocity(newProjectile.velocity.x, newProjectile.velocity.y);
      }
    });

    connection.db.projectile.onDelete((_ctx, projectile) => {
      console.log(projectile);
      this.projectiles.delete(projectile.id);
    });
  }

  public update(deltaTime: number) {
    for (const projectile of this.projectiles.values()) {
      projectile.update(deltaTime);
    }
  }

  public getAllProjectiles(): IterableIterator<Projectile> {
    return this.projectiles.values();
  }
}
