import { Projectile, ProjectileFactory, MoagProjectile } from "../objects/projectiles";
import { getConnection } from "../spacetimedb-connection";
import { ProjectileImpactParticlesManager } from "./ProjectileImpactParticlesManager";
import { ProjectileTextureSheet } from "./ProjectileTextureSheet";
import { TerrainManager } from "./TerrainManager";
import { TEAM_COLORS } from "../constants";
import { UNIT_TO_PIXEL } from "../game";

const MAP_EXTENSION_FACTOR = 2;
const WARNING_LINE_DASH_PATTERN = [10, 10];
const WARNING_LINE_OPACITY = 0.5;

export class ProjectileManager {
  private projectiles: Map<string, Projectile> = new Map();
  private worldId: string;
  private particlesManager: ProjectileImpactParticlesManager;
  private terrainManager: TerrainManager;

  constructor(worldId: string, terrainManager: TerrainManager) {
    this.worldId = worldId;
    this.terrainManager = terrainManager;
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

  public drawWarningLines(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const worldWidth = this.terrainManager.getWorldWidth();
    const worldHeight = this.terrainManager.getWorldHeight();
    
    if (worldWidth === 0 || worldHeight === 0) return;

    for (const projectile of this.projectiles.values()) {
      if (!(projectile instanceof MoagProjectile)) continue;

      const x = projectile.getX();
      const y = projectile.getY();
      const velocityX = projectile.getVelocityX();
      const velocityY = projectile.getVelocityY();

      const angle = Math.atan2(velocityY, velocityX);
      const perpAngle = angle + Math.PI / 2;

      const perpDx = Math.cos(perpAngle);
      const perpDy = Math.sin(perpAngle);

      const maxDistance = Math.max(worldWidth, worldHeight) * MAP_EXTENSION_FACTOR;

      const leftX1 = x + perpDx * maxDistance;
      const leftY1 = y + perpDy * maxDistance;
      const rightX1 = x - perpDx * maxDistance;
      const rightY1 = y - perpDy * maxDistance;

      ctx.save();
      const teamColor = projectile.getAlliance() === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
      ctx.strokeStyle = teamColor.replace(/^#/, 'rgba(') 
        .replace(/(..)(..)(..)$/, (_, r, g, b) => 
          `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${WARNING_LINE_OPACITY})`);
      ctx.lineWidth = 2;
      ctx.setLineDash(WARNING_LINE_DASH_PATTERN);

      ctx.beginPath();
      ctx.moveTo(leftX1 * UNIT_TO_PIXEL - cameraX, leftY1 * UNIT_TO_PIXEL - cameraY);
      ctx.lineTo(rightX1 * UNIT_TO_PIXEL - cameraX, rightY1 * UNIT_TO_PIXEL - cameraY);
      ctx.stroke();

      ctx.restore();
    }
  }

  public getAllProjectiles(): IterableIterator<Projectile> {
    return this.projectiles.values();
  }
}
