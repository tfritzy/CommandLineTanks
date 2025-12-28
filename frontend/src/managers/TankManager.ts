import { Tank } from "../objects/Tank";
import { getConnection } from "../spacetimedb-connection";
import { DeadTankParticlesManager } from "./DeadTankParticlesManager";
import { TankIndicatorManager } from "./TankIndicatorManager";
import { TargetingReticle } from "../objects/TargetingReticle";
import { ScreenShake } from "../utils/ScreenShake";
import { MuzzleFlashParticlesManager } from "./MuzzleFlashParticlesManager";
import { GUN_BARREL_LENGTH } from "../constants";
import type { SubscriptionHandle, EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import TankFireStateRow from "../../module_bindings/tank_fire_state_type";

export class TankManager {
  private tanks: Map<string, Tank> = new Map();
  private playerTankId: string | null = null;
  private playerTargetTankId: string | null = null;
  private targetingReticle: TargetingReticle;
  private worldId: string;
  private particlesManager: DeadTankParticlesManager;
  private indicatorManager: TankIndicatorManager;
  private screenShake: ScreenShake;
  private muzzleFlashManager: MuzzleFlashParticlesManager;
  private subscriptionHandle: SubscriptionHandle | null = null;
  private handleTankInsert:
    | ((ctx: EventContext, tank: Infer<typeof TankRow>) => void)
    | null = null;
  private handleTankUpdate:
    | ((
        ctx: EventContext,
        oldTank: Infer<typeof TankRow>,
        newTank: Infer<typeof TankRow>
      ) => void)
    | null = null;
  private handleTankDelete:
    | ((ctx: EventContext, tank: Infer<typeof TankRow>) => void)
    | null = null;
  private handleFireStateUpdate:
    | ((
        ctx: EventContext,
        oldState: Infer<typeof TankFireStateRow>,
        newState: Infer<typeof TankFireStateRow>
      ) => void)
    | null = null;

  constructor(worldId: string, screenShake: ScreenShake) {
    this.worldId = worldId;
    this.particlesManager = new DeadTankParticlesManager();
    this.indicatorManager = new TankIndicatorManager();
    this.muzzleFlashManager = new MuzzleFlashParticlesManager();
    this.targetingReticle = new TargetingReticle();
    this.screenShake = screenShake;
    this.subscribeToTanks();
  }

  private subscribeToTanks() {
    const connection = getConnection();
    if (!connection) return;

    this.subscriptionHandle = connection
      .subscriptionBuilder()
      .onError((e) => console.log("Ah fuck", e))
      .subscribe([`SELECT * FROM tank WHERE WorldId = '${this.worldId}'`]);

    this.handleTankInsert = (
      _ctx: EventContext,
      tank: Infer<typeof TankRow>
    ) => {
      if (tank.worldId !== this.worldId) return;
      this.buildTank(tank);

      if (
        connection.identity &&
        tank.owner.isEqual(connection.identity) &&
        tank.worldId == this.worldId
      ) {
        this.playerTankId = tank.id;
        this.updatePlayerTarget(tank.target);
      }
    };

    this.handleTankUpdate = (
      _ctx: EventContext,
      oldTank: Infer<typeof TankRow>,
      newTank: Infer<typeof TankRow>
    ) => {
      if (newTank.worldId !== this.worldId) return;
      const tank = this.tanks.get(newTank.id);
      if (tank) {
        if (oldTank.health > 0 && newTank.health <= 0) {
          const pos = tank.getPosition();
          this.particlesManager.spawnParticles(pos.x, pos.y, newTank.alliance);

          if (newTank.id === this.playerTankId) {
            this.screenShake.shake(20, 0.5);
          }
        }

        if (
          oldTank.target !== null &&
          newTank.target === null &&
          newTank.health > 0
        ) {
          const pos = tank.getPosition();
          this.indicatorManager.spawnFloatingLabel(
            pos.x,
            pos.y - 0.5,
            "Target lost"
          );
        }

        if (oldTank.isRepairing && !newTank.isRepairing && newTank.health > 0) {
          const pos = tank.getPosition();
          if (newTank.health >= newTank.maxHealth) {
            this.indicatorManager.spawnFloatingLabel(
              pos.x,
              pos.y - 0.5,
              "Repair complete"
            );
          } else {
            this.indicatorManager.spawnFloatingLabel(
              pos.x,
              pos.y - 0.5,
              "Repair interrupted"
            );
          }
        }

        tank.setPosition(newTank.positionX, newTank.positionY);
        tank.setTargetTurretRotation(newTank.targetTurretRotation);
        tank.setTurretAngularVelocity(newTank.turretAngularVelocity);
        tank.setTurretRotation(newTank.turretRotation);
        tank.setPath(newTank.path);
        tank.setHealth(newTank.health);
        tank.setAlliance(newTank.alliance);
        tank.setGuns(newTank.guns);
        tank.setSelectedGunIndex(newTank.selectedGunIndex);
        tank.setHasShield(newTank.hasShield);
        tank.setRemainingImmunityMicros(newTank.remainingImmunityMicros);
      } else {
        this.buildTank(newTank);
      }

      if (
        connection.identity &&
        newTank.owner.isEqual(connection.identity) &&
        newTank.worldId == this.worldId
      ) {
        if (oldTank.target !== newTank.target) {
          this.updatePlayerTarget(newTank.target);
        }
      }
    };

    this.handleTankDelete = (
      _ctx: EventContext,
      tank: Infer<typeof TankRow>
    ) => {
      if (tank.worldId !== this.worldId) return;
      this.tanks.delete(tank.id);

      if (this.playerTankId === tank.id && tank.worldId == this.worldId) {
        this.playerTankId = null;
      }

      if (this.playerTargetTankId === tank.id && tank.worldId == this.worldId) {
        this.updatePlayerTarget(null);
      }
    };

    this.handleFireStateUpdate = (
      _ctx: EventContext,
      _oldState: Infer<typeof TankFireStateRow>,
      newState: Infer<typeof TankFireStateRow>
    ) => {
      const tankRow = connection.db.tank.id.find(newState.tankId);
      if (tankRow && tankRow.health > 0) {
        const barrelTipX = tankRow.positionX + Math.cos(tankRow.turretRotation) * GUN_BARREL_LENGTH;
        const barrelTipY = tankRow.positionY + Math.sin(tankRow.turretRotation) * GUN_BARREL_LENGTH;
        this.muzzleFlashManager.spawnMuzzleFlash(barrelTipX, barrelTipY, tankRow.turretRotation, tankRow.alliance);
      }
    };

    connection.db.tank.onInsert(this.handleTankInsert);
    connection.db.tank.onUpdate(this.handleTankUpdate);
    connection.db.tank.onDelete(this.handleTankDelete);
    connection.db.tankFireState.onUpdate(this.handleFireStateUpdate);

    for (const tank of connection.db.tank.iter()) {
      if (tank.worldId === this.worldId) {
        this.buildTank(tank);

        if (
          connection.identity &&
          tank.owner.isEqual(connection.identity)
        ) {
          this.playerTankId = tank.id;
          this.updatePlayerTarget(tank.target);
        }
      }
    }
  }

  buildTank(tank: Infer<typeof TankRow>) {
    const connection = getConnection();
    const isPlayerTank = connection?.identity && tank.owner.isEqual(connection.identity);
    
    const newTank = new Tank(
      tank.id,
      tank.positionX,
      tank.positionY,
      tank.turretRotation,
      tank.name,
      tank.alliance,
      tank.health,
      tank.maxHealth,
      tank.turretAngularVelocity,
      tank.path,
      tank.guns,
      tank.selectedGunIndex,
      tank.hasShield,
      tank.remainingImmunityMicros
    );
    
    if (isPlayerTank) {
      newTank.setIsPlayerTank(true);
    }
    
    this.tanks.set(tank.id, newTank);
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleTankInsert)
        connection.db.tank.removeOnInsert(this.handleTankInsert);
      if (this.handleTankUpdate)
        connection.db.tank.removeOnUpdate(this.handleTankUpdate);
      if (this.handleTankDelete)
        connection.db.tank.removeOnDelete(this.handleTankDelete);
      if (this.handleFireStateUpdate)
        connection.db.tankFireState.removeOnUpdate(this.handleFireStateUpdate);
    }

    if (this.subscriptionHandle) {
      this.subscriptionHandle.unsubscribe();
    }
  }

  private updatePlayerTarget(targetId: string | null | undefined) {
    const newTargetId = targetId ?? null;

    if (this.playerTargetTankId === newTargetId) {
      return;
    }

    this.playerTargetTankId = newTargetId;

    if (this.playerTargetTankId) {
      const targetedTank = this.tanks.get(this.playerTargetTankId);
      if (targetedTank) {
        this.targetingReticle.setTank(targetedTank);
      }
    } else {
      this.targetingReticle.clearTank();
    }
  }

  public update(deltaTime: number) {
    for (const tank of this.tanks.values()) {
      tank.update(deltaTime);
    }
    this.particlesManager.update(deltaTime);
    this.indicatorManager.update(deltaTime);
    this.muzzleFlashManager.update(deltaTime);
  }

  public getPlayerTank(): Tank | null {
    return this.playerTankId ? this.tanks.get(this.playerTankId) || null : null;
  }

  public drawPaths(ctx: CanvasRenderingContext2D) {
    const playerTank = this.getPlayerTank();
    if (playerTank) {
      playerTank.drawPath(ctx);
    }
  }

  public drawShadows(ctx: CanvasRenderingContext2D) {
    for (const tank of this.tanks.values()) {
      tank.drawShadow(ctx);
    }
  }

  public drawBodies(ctx: CanvasRenderingContext2D) {
    for (const tank of this.tanks.values()) {
      tank.drawBody(ctx);
    }
  }

  public drawHealthBars(ctx: CanvasRenderingContext2D) {
    for (const tank of this.tanks.values()) {
      tank.drawHealthBar(ctx);
    }
  }

  public drawNameLabels(ctx: CanvasRenderingContext2D) {
    for (const tank of this.tanks.values()) {
      tank.drawNameLabel(ctx);
    }
  }

  public drawTankIndicators(ctx: CanvasRenderingContext2D) {
    this.indicatorManager.draw(ctx);
    this.targetingReticle.draw(ctx);
  }

  public drawParticles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    this.particlesManager.draw(
      ctx,
      cameraX,
      cameraY,
      viewportWidth,
      viewportHeight
    );
    this.muzzleFlashManager.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
  }

  public getAllTanks(): IterableIterator<Tank> {
    return this.tanks.values();
  }
}
