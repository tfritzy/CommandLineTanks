import { Tank } from "../objects/Tank";
import { SoundManager } from "./SoundManager";
import { getConnection } from "../spacetimedb-connection";
import { DeadTankParticlesManager } from "./DeadTankParticlesManager";
import { TankIndicatorManager } from "./TankIndicatorManager";
import { TargetingReticle } from "../objects/TargetingReticle";
import { ScreenShake } from "../utils/ScreenShake";
import { MuzzleFlashParticlesManager } from "./MuzzleFlashParticlesManager";
import { GUN_BARREL_LENGTH } from "../constants";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import TankFireStateRow from "../../module_bindings/tank_fire_state_type";
import TankPathRow from "../../module_bindings/tank_path_table";
import { createMultiTableSubscription, type MultiTableSubscription } from "../utils/tableSubscription";

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
  private soundManager: SoundManager;
  private subscription: MultiTableSubscription | null = null;

  constructor(worldId: string, screenShake: ScreenShake, soundManager: SoundManager) {
    this.worldId = worldId;
    this.soundManager = soundManager;
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

    this.subscription = createMultiTableSubscription()
      .add<typeof TankRow>({
        table: connection.db.tank,
        handlers: {
          onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
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
          },
          onUpdate: (_ctx: EventContext, oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (newTank.worldId !== this.worldId) return;
            const tank = this.tanks.get(newTank.id);
            if (tank) {
              if (oldTank.health > 0 && newTank.health <= 0) {
                const pos = tank.getPosition();
                this.particlesManager.spawnParticles(pos.x, pos.y, newTank.alliance);

                if (newTank.id === this.playerTankId) {
                  this.soundManager.play("death", 0.5, pos.x, pos.y);
                  this.screenShake.shake(20, 0.5);
                }
              }

              if (oldTank.health <= 0 && newTank.health > 0) {
                tank.clearPositionBuffer();
              }

              if (oldTank.message !== newTank.message && newTank.message) {
                const pos = tank.getPosition();
                this.indicatorManager.spawnFloatingLabel(
                  pos.x,
                  pos.y - 0.5,
                  newTank.message
                );
              }

              if (oldTank.health > newTank.health && newTank.health > 0) {
                if (newTank.id === this.playerTankId) {
                  const pos = tank.getPosition();
                  this.soundManager.play("damage", 0.5, pos.x, pos.y);
                } else if (
                  connection.identity &&
                  newTank.lastDamagedBy &&
                  newTank.lastDamagedBy.isEqual(connection.identity)
                ) {
                  const pos = tank.getPosition();
                  this.soundManager.play("hit", 0.5, pos.x, pos.y);
                }
              }

              if (oldTank.hasShield && !newTank.hasShield) {
                if (newTank.id === this.playerTankId) {
                  const pos = tank.getPosition();
                  this.soundManager.play("shield-pop", 0.5, pos.x, pos.y);
                }
              }

              if (oldTank.selectedGunIndex !== newTank.selectedGunIndex) {
                if (newTank.id === this.playerTankId) {
                  const pos = tank.getPosition();
                  this.soundManager.play("weapon-switch", 0.5, pos.x, pos.y);
                }
              }

              tank.setPosition(
                newTank.positionX,
                newTank.positionY,
                newTank.updatedAt
              );
              tank.setTargetTurretRotation(newTank.targetTurretRotation);
              tank.setTurretAngularVelocity(newTank.turretAngularVelocity);
              tank.setTurretRotation(newTank.turretRotation);
              tank.setHealth(newTank.health);
              tank.setAlliance(newTank.alliance);
              tank.setGuns(newTank.guns);
              tank.setSelectedGunIndex(newTank.selectedGunIndex);
              tank.setHasShield(newTank.hasShield);
              tank.setRemainingImmunityMicros(newTank.remainingImmunityMicros);
              tank.setTargetCode(newTank.targetCode);
              tank.setMessage(newTank.message ?? null);
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
          },
          onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.worldId !== this.worldId) return;
            this.tanks.delete(tank.id);

            if (this.playerTankId === tank.id && tank.worldId == this.worldId) {
              this.playerTankId = null;
            }

            if (this.playerTargetTankId === tank.id && tank.worldId == this.worldId) {
              this.updatePlayerTarget(null);
            }
          }
        }
      })
      .add<typeof TankPathRow>({
        table: connection.db.tankPath,
        handlers: {
          onInsert: (_ctx: EventContext, tankPath: Infer<typeof TankPathRow>) => {
            if (tankPath.worldId !== this.worldId) return;
            const tank = this.tanks.get(tankPath.tankId);
            if (tank) {
              tank.setPath(tankPath.path);
            }
          },
          onUpdate: (_ctx: EventContext, _oldPath: Infer<typeof TankPathRow>, newPath: Infer<typeof TankPathRow>) => {
            if (newPath.worldId !== this.worldId) return;
            const tank = this.tanks.get(newPath.tankId);
            if (tank) {
              tank.setPath(newPath.path);
            }
          },
          onDelete: (_ctx: EventContext, tankPath: Infer<typeof TankPathRow>) => {
            if (tankPath.worldId !== this.worldId) return;
            const tank = this.tanks.get(tankPath.tankId);
            if (tank) {
              tank.setPath([]);
            }
          }
        }
      })
      .add<typeof TankFireStateRow>({
        table: connection.db.tankFireState,
        handlers: {
          onInsert: (_ctx: EventContext, newState: Infer<typeof TankFireStateRow>) => {
            this.handleTankFire(newState);
          },
          onUpdate: (_ctx: EventContext, _oldState: Infer<typeof TankFireStateRow>, newState: Infer<typeof TankFireStateRow>) => {
            this.handleTankFire(newState);
          }
        },
        loadInitialData: false
      });
  }

  buildTank(tank: Infer<typeof TankRow>) {
    const connection = getConnection();

    const tankPath = connection?.db.tankPath.tankId.find(tank.id);
    const path = tankPath?.path ?? [];

    const newTank = new Tank(
      tank.id,
      tank.positionX,
      tank.positionY,
      tank.turretRotation,
      tank.name,
      tank.targetCode,
      tank.alliance,
      tank.health,
      tank.maxHealth,
      tank.turretAngularVelocity,
      path,
      tank.guns,
      tank.selectedGunIndex,
      tank.hasShield,
      tank.remainingImmunityMicros
    );

    this.tanks.set(tank.id, newTank);
  }

  private handleTankFire(fireState: Infer<typeof TankFireStateRow>) {
    const connection = getConnection();
    if (!connection) return;

    const tankRow = connection.db.tank.id.find(fireState.tankId);
    if (tankRow && tankRow.health > 0) {
      const barrelTipX =
        tankRow.positionX +
        Math.cos(tankRow.turretRotation) * GUN_BARREL_LENGTH;
      const barrelTipY =
        tankRow.positionY +
        Math.sin(tankRow.turretRotation) * GUN_BARREL_LENGTH;

      this.muzzleFlashManager.spawnMuzzleFlash(
        barrelTipX,
        barrelTipY,
        tankRow.turretRotation,
        tankRow.alliance
      );
      this.soundManager.play("fire", 0.4, tankRow.positionX, tankRow.positionY);
    }
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
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

  public getTank(tankId: string): Tank | undefined {
    return this.tanks.get(tankId);
  }

  public getPlayerTank(): Tank | null {
    return this.playerTankId ? this.tanks.get(this.playerTankId) || null : null;
  }

  public getPlayerTankId(): string | null {
    return this.playerTankId;
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
    const playerTank = this.playerTankId ? this.tanks.get(this.playerTankId) : null;
    const playerAlliance = playerTank ? playerTank.getAlliance() : null;

    for (const tank of this.tanks.values()) {
      const isPlayerTank = tank.id === this.playerTankId;
      const isFriendly = playerAlliance !== null && tank.getAlliance() === playerAlliance;

      if (isPlayerTank || isFriendly) {
        tank.drawNameLabelWithoutTargetCode(ctx);
      } else {
        tank.drawNameLabel(ctx);
      }
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
    this.muzzleFlashManager.draw(
      ctx,
      cameraX,
      cameraY,
      viewportWidth,
      viewportHeight
    );
  }

  public getAllTanks(): IterableIterator<Tank> {
    return this.tanks.values();
  }
}
