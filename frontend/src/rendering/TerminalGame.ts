import { AsciiRenderer } from "./AsciiRenderer";
import { getConnection } from "../spacetimedb-connection";
import { isCurrentIdentity } from "../spacetimedb-connection";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import TankTransformRow from "../../module_bindings/tank_transform_type";
import ProjectileRow from "../../module_bindings/projectile_type";
import ProjectileTransformRow from "../../module_bindings/projectile_transform_type";
import WorldRow from "../../module_bindings/world_type";
import TerrainDetailRow from "../../module_bindings/terrain_detail_type";
import PickupRow from "../../module_bindings/pickup_type";
import { createMultiTableSubscription, type MultiTableSubscription } from "../utils/tableSubscription";
import { INTERPOLATION_DELAY, BUFFER_DURATION } from "../constants";
import { ServerTimeSync } from "../utils/ServerTimeSync";

interface TankState {
  id: string;
  x: number;
  y: number;
  turretRotation: number;
  alliance: number;
  health: number;
  maxHealth: number;
  name: string;
  targetCode: string;
  positionBuffer: Array<{ x: number; y: number; serverTimestampMs: number }>;
}

interface ProjectileState {
  id: bigint;
  x: number;
  y: number;
  projectileType: string;
  alliance: number;
  positionBuffer: Array<{ x: number; y: number; serverTimestampMs: number }>;
}

interface TerrainDetailState {
  id: string;
  x: number;
  y: number;
  detailType: string;
  health: number | undefined;
}

interface PickupState {
  id: string;
  x: number;
  y: number;
  pickupType: string;
}

const CAMERA_FOLLOW_SPEED = 15;
const CAMERA_TELEPORT_THRESHOLD = 500;

export class TerminalGame {
  private renderer: AsciiRenderer;
  private worldId: string;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  private tanks: Map<string, TankState> = new Map();
  private projectiles: Map<bigint, ProjectileState> = new Map();
  private terrainDetails: Map<string, TerrainDetailState> = new Map();
  private pickups: Map<string, PickupState> = new Map();

  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: { tag: string }[] = [];

  private currentCameraX: number = 0;
  private currentCameraY: number = 0;
  private playerTankId: string | null = null;

  private subscription: MultiTableSubscription | null = null;

  constructor(container: HTMLDivElement, worldId: string) {
    this.worldId = worldId;
    this.renderer = new AsciiRenderer();
    this.renderer.mount(container);
    this.subscribeToData();
  }

  private subscribeToData(): void {
    const connection = getConnection();
    if (!connection) return;

    this.subscription = createMultiTableSubscription()
      .add<typeof WorldRow>({
        table: connection.db.world,
        handlers: {
          onInsert: (_ctx: EventContext, world: Infer<typeof WorldRow>) => {
            if (world.id !== this.worldId) return;
            this.worldWidth = world.width;
            this.worldHeight = world.height;
            this.baseTerrainLayer = world.baseTerrainLayer;
            this.renderer.setWorldDimensions(world.width, world.height);
          },
          onUpdate: (_ctx: EventContext, _old: Infer<typeof WorldRow>, world: Infer<typeof WorldRow>) => {
            if (world.id !== this.worldId) return;
            this.worldWidth = world.width;
            this.worldHeight = world.height;
            this.baseTerrainLayer = world.baseTerrainLayer;
            this.renderer.setWorldDimensions(world.width, world.height);
          }
        }
      })
      .add<typeof TankRow>({
        table: connection.db.tank,
        handlers: {
          onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.worldId !== this.worldId) return;
            this.upsertTank(tank);
          },
          onUpdate: (_ctx: EventContext, _old: Infer<typeof TankRow>, tank: Infer<typeof TankRow>) => {
            if (tank.worldId !== this.worldId) return;
            this.upsertTank(tank);
          },
          onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.worldId !== this.worldId) return;
            this.tanks.delete(tank.id);
            if (this.playerTankId === tank.id) {
              this.playerTankId = null;
            }
          }
        }
      })
      .add<typeof TankTransformRow>({
        table: connection.db.tankTransform,
        handlers: {
          onInsert: (_ctx: EventContext, transform: Infer<typeof TankTransformRow>) => {
            if (transform.worldId !== this.worldId) return;
            this.updateTankTransform(transform);
          },
          onUpdate: (_ctx: EventContext, _old: Infer<typeof TankTransformRow>, transform: Infer<typeof TankTransformRow>) => {
            if (transform.worldId !== this.worldId) return;
            this.updateTankTransform(transform);
          }
        }
      })
      .add<typeof ProjectileRow>({
        table: connection.db.projectile,
        handlers: {
          onInsert: (_ctx: EventContext, projectile: Infer<typeof ProjectileRow>) => {
            if (projectile.worldId !== this.worldId) return;
            this.upsertProjectile(projectile);
          },
          onUpdate: (_ctx: EventContext, _old: Infer<typeof ProjectileRow>, projectile: Infer<typeof ProjectileRow>) => {
            if (projectile.worldId !== this.worldId) return;
            this.upsertProjectile(projectile);
          },
          onDelete: (_ctx: EventContext, projectile: Infer<typeof ProjectileRow>) => {
            if (projectile.worldId !== this.worldId) return;
            this.projectiles.delete(projectile.id);
          }
        }
      })
      .add<typeof ProjectileTransformRow>({
        table: connection.db.projectileTransform,
        handlers: {
          onInsert: (_ctx: EventContext, transform: Infer<typeof ProjectileTransformRow>) => {
            if (transform.worldId !== this.worldId) return;
            this.updateProjectileTransform(transform);
          },
          onUpdate: (_ctx: EventContext, _old: Infer<typeof ProjectileTransformRow>, transform: Infer<typeof ProjectileTransformRow>) => {
            if (transform.worldId !== this.worldId) return;
            this.updateProjectileTransform(transform);
          }
        }
      })
      .add<typeof TerrainDetailRow>({
        table: connection.db.terrainDetail,
        handlers: {
          onInsert: (_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
            if (detail.worldId !== this.worldId) return;
            this.terrainDetails.set(detail.id, {
              id: detail.id,
              x: detail.positionX,
              y: detail.positionY,
              detailType: detail.type.tag,
              health: detail.health
            });
          },
          onUpdate: (_ctx: EventContext, _old: Infer<typeof TerrainDetailRow>, detail: Infer<typeof TerrainDetailRow>) => {
            if (detail.worldId !== this.worldId) return;
            const existing = this.terrainDetails.get(detail.id);
            if (existing) {
              existing.health = detail.health;
            }
          },
          onDelete: (_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
            if (detail.worldId !== this.worldId) return;
            this.terrainDetails.delete(detail.id);
          }
        }
      })
      .add<typeof PickupRow>({
        table: connection.db.pickup,
        handlers: {
          onInsert: (_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
            if (pickup.worldId !== this.worldId) return;
            this.pickups.set(pickup.id, {
              id: pickup.id,
              x: pickup.positionX,
              y: pickup.positionY,
              pickupType: pickup.type.tag
            });
          },
          onDelete: (_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
            if (pickup.worldId !== this.worldId) return;
            this.pickups.delete(pickup.id);
          }
        }
      });

    const cachedWorld = connection.db.world.Id.find(this.worldId);
    if (cachedWorld) {
      this.worldWidth = cachedWorld.width;
      this.worldHeight = cachedWorld.height;
      this.baseTerrainLayer = cachedWorld.baseTerrainLayer;
      this.renderer.setWorldDimensions(cachedWorld.width, cachedWorld.height);
    }
  }

  private upsertTank(tank: Infer<typeof TankRow>): void {
    const existing = this.tanks.get(tank.id);
    if (existing) {
      existing.alliance = tank.alliance;
      existing.health = tank.health;
      existing.maxHealth = tank.maxHealth;
      existing.name = tank.name;
      existing.targetCode = tank.targetCode;
    } else {
      this.tanks.set(tank.id, {
        id: tank.id,
        x: 0,
        y: 0,
        turretRotation: 0,
        alliance: tank.alliance,
        health: tank.health,
        maxHealth: tank.maxHealth,
        name: tank.name,
        targetCode: tank.targetCode,
        positionBuffer: []
      });
    }

    if (isCurrentIdentity(tank.owner) && tank.worldId === this.worldId) {
      this.playerTankId = tank.id;
    }
  }

  private updateTankTransform(transform: Infer<typeof TankTransformRow>): void {
    const tank = this.tanks.get(transform.tankId);
    if (!tank) {
      const connection = getConnection();
      if (!connection) return;
      const tankData = connection.db.tank.id.find(transform.tankId);
      if (tankData && tankData.worldId === this.worldId) {
        this.upsertTank(tankData);
        this.updateTankTransform(transform);
      }
      return;
    }

    tank.turretRotation = transform.turretRotation;

    const serverTimestampMs = Number(transform.updatedAt / 1000n);
    tank.positionBuffer.push({
      x: transform.positionX,
      y: transform.positionY,
      serverTimestampMs
    });

    const currentServerTimeMs = ServerTimeSync.getInstance().getServerTime();
    const cutoffTime = currentServerTimeMs - BUFFER_DURATION - INTERPOLATION_DELAY;
    while (tank.positionBuffer.length > 2 && tank.positionBuffer[0].serverTimestampMs < cutoffTime) {
      tank.positionBuffer.shift();
    }
  }

  private upsertProjectile(projectile: Infer<typeof ProjectileRow>): void {
    const existing = this.projectiles.get(projectile.id);
    if (existing) {
      existing.projectileType = projectile.projectileType.tag;
      existing.alliance = projectile.alliance;
    } else {
      this.projectiles.set(projectile.id, {
        id: projectile.id,
        x: 0,
        y: 0,
        projectileType: projectile.projectileType.tag,
        alliance: projectile.alliance,
        positionBuffer: []
      });
    }
  }

  private updateProjectileTransform(transform: Infer<typeof ProjectileTransformRow>): void {
    const projectile = this.projectiles.get(transform.projectileId);
    if (!projectile) {
      const connection = getConnection();
      if (!connection) return;
      const projData = connection.db.projectile.id.find(transform.projectileId);
      if (projData && projData.worldId === this.worldId) {
        this.upsertProjectile(projData);
        this.updateProjectileTransform(transform);
      }
      return;
    }

    projectile.x = transform.positionX;
    projectile.y = transform.positionY;
  }

  private getInterpolatedPosition(
    buffer: Array<{ x: number; y: number; serverTimestampMs: number }>,
    fallbackX: number,
    fallbackY: number
  ): { x: number; y: number } {
    if (buffer.length === 0) {
      return { x: fallbackX, y: fallbackY };
    }

    const currentServerTimeMs = ServerTimeSync.getInstance().getServerTime();
    const renderTime = currentServerTimeMs - INTERPOLATION_DELAY;

    if (buffer.length === 1) {
      return { x: buffer[0].x, y: buffer[0].y };
    }

    let beforeIdx = -1;
    let afterIdx = -1;

    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i].serverTimestampMs <= renderTime) {
        beforeIdx = i;
      } else {
        afterIdx = i;
        break;
      }
    }

    if (beforeIdx === -1) {
      return { x: buffer[0].x, y: buffer[0].y };
    }

    if (afterIdx === -1) {
      return { x: buffer[buffer.length - 1].x, y: buffer[buffer.length - 1].y };
    }

    const before = buffer[beforeIdx];
    const after = buffer[afterIdx];
    const timeDiff = after.serverTimestampMs - before.serverTimestampMs;

    if (timeDiff <= 0) {
      return { x: after.x, y: after.y };
    }

    const t = (renderTime - before.serverTimestampMs) / timeDiff;
    const clampedT = Math.max(0, Math.min(1, t));

    return {
      x: before.x + (after.x - before.x) * clampedT,
      y: before.y + (after.y - before.y) * clampedT
    };
  }

  private update(currentTime: number = 0): void {
    const deltaTime = this.lastFrameTime === 0 ? 0 : (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    let targetCameraX = this.currentCameraX;
    let targetCameraY = this.currentCameraY;

    if (this.playerTankId) {
      const playerTank = this.tanks.get(this.playerTankId);
      if (playerTank) {
        const pos = this.getInterpolatedPosition(playerTank.positionBuffer, playerTank.x, playerTank.y);
        targetCameraX = pos.x;
        targetCameraY = pos.y;
      }
    }

    const distanceX = targetCameraX - this.currentCameraX;
    const distanceY = targetCameraY - this.currentCameraY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    if (distanceSquared > CAMERA_TELEPORT_THRESHOLD * CAMERA_TELEPORT_THRESHOLD) {
      this.currentCameraX = targetCameraX;
      this.currentCameraY = targetCameraY;
    } else {
      const clampedDeltaTime = Math.min(deltaTime, 1 / 30);
      const lerpFactor = Math.min(1, clampedDeltaTime * CAMERA_FOLLOW_SPEED);
      this.currentCameraX += distanceX * lerpFactor;
      this.currentCameraY += distanceY * lerpFactor;
    }

    this.renderer.setCamera(this.currentCameraX, this.currentCameraY);
    this.renderer.clearBuffer();

    this.renderer.drawTerrain(this.baseTerrainLayer, this.worldWidth, this.worldHeight);

    for (const detail of this.terrainDetails.values()) {
      this.renderer.drawTerrainDetail(detail.x, detail.y, detail.detailType, detail.health);
    }

    for (const pickup of this.pickups.values()) {
      this.renderer.drawPickup(pickup.x, pickup.y, pickup.pickupType);
    }

    for (const tank of this.tanks.values()) {
      const pos = this.getInterpolatedPosition(tank.positionBuffer, tank.x, tank.y);
      this.renderer.drawTank(
        pos.x,
        pos.y,
        tank.turretRotation,
        tank.alliance,
        tank.health,
        tank.maxHealth,
        tank.name,
        tank.targetCode
      );
    }

    for (const projectile of this.projectiles.values()) {
      this.renderer.drawProjectile(projectile.x, projectile.y, projectile.projectileType, projectile.alliance);
    }

    this.renderer.render();

    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
  }

  public start(): void {
    if (!this.animationFrameId) {
      this.lastFrameTime = 0;
      this.update();
    }
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.renderer.unmount();
    this.tanks.clear();
    this.projectiles.clear();
    this.terrainDetails.clear();
    this.pickups.clear();
  }
}
