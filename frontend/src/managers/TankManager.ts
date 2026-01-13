import { Tank } from "../objects/Tank";
import { SoundManager } from "./SoundManager";
import { getConnection, isCurrentIdentity } from "../spacetimedb-connection";
import { DeadTankParticlesManager } from "./DeadTankParticlesManager";
import { TankIndicatorManager } from "./TankIndicatorManager";
import { TargetingReticle } from "../objects/TargetingReticle";
import { ScreenShake } from "../utils/ScreenShake";
import { MuzzleFlashParticlesManager } from "./MuzzleFlashParticlesManager";
import { GUN_BARREL_LENGTH, UNIT_TO_PIXEL } from "../constants";
import { COLORS } from "../theme/colors";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import TankTransformRow from "../../module_bindings/tank_transform_type";
import TankFireStateRow from "../../module_bindings/tank_fire_state_type";
import TankPathRow from "../../module_bindings/tank_path_table";
import { createMultiTableSubscription, type MultiTableSubscription } from "../utils/tableSubscription";

export class TankManager {
  private tanks: Map<string, Tank> = new Map();
  private playerTankId: string | null = null;
  private playerTargetTankId: string | null = null;
  private targetingReticle: TargetingReticle;
  private gameId: string;
  private particlesManager: DeadTankParticlesManager;
  private indicatorManager: TankIndicatorManager;
  private screenShake: ScreenShake;
  private muzzleFlashManager: MuzzleFlashParticlesManager;
  private soundManager: SoundManager;
  private subscription: MultiTableSubscription | null = null;

  constructor(gameId: string, screenShake: ScreenShake, soundManager: SoundManager) {
    this.gameId = gameId;
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
            if (tank.gameId !== this.gameId) return;
            this.buildTank(tank.id);
          },
          onUpdate: (_ctx: EventContext, oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (newTank.gameId !== this.gameId) return;
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
                  this.soundManager.play("self-damage", 0.5, pos.x, pos.y);
                } else if (
                  newTank.lastDamagedBy &&
                  isCurrentIdentity(newTank.lastDamagedBy)
                ) {
                  const pos = tank.getPosition();
                  this.soundManager.play("enemy-damage", 0.5, pos.x, pos.y);
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

              tank.setHealth(newTank.health);
              tank.setGuns(newTank.guns);
              tank.setSelectedGunIndex(newTank.selectedGunIndex);
              tank.setHasShield(newTank.hasShield);
              tank.setRemainingImmunityMicros(newTank.remainingImmunityMicros);
              tank.setMessage(newTank.message ?? null);
              tank.setAlliance(newTank.alliance);
              tank.setTargetCode(newTank.targetCode);
              tank.setName(newTank.name);
              tank.setMaxHealth(newTank.maxHealth);
            } else {
              this.buildTank(newTank.id);
            }

            if (oldTank.target !== newTank.target) {
              if (isCurrentIdentity(newTank.owner) && newTank.gameId == this.gameId) {
                this.updatePlayerTarget(newTank.target);
              }
            }
          },
          onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.gameId !== this.gameId) return;
            this.tanks.delete(tank.id);

            if (this.playerTankId === tank.id && tank.gameId == this.gameId) {
              this.playerTankId = null;
            }

            if (this.playerTargetTankId === tank.id && tank.gameId == this.gameId) {
              this.updatePlayerTarget(null);
            }
          }
        }
      })
      .add<typeof TankTransformRow>({
        table: connection.db.tankTransform,
        handlers: {
          onInsert: (_ctx: EventContext, transform: Infer<typeof TankTransformRow>) => {
            if (transform.gameId !== this.gameId) return;
            
            const tankData = connection.db.tank.id.find(transform.tankId);
            if (tankData && isCurrentIdentity(tankData.owner) && tankData.gameId == this.gameId) {
              this.playerTankId = transform.tankId;
              this.updatePlayerTarget(tankData.target);
            }
            
            const existingTank = this.tanks.get(transform.tankId);
            if (existingTank) {
              existingTank.setPosition(transform.positionX, transform.positionY, transform.updatedAt);
              existingTank.setTargetTurretRotation(transform.targetTurretRotation);
              existingTank.setTurretAngularVelocity(transform.turretAngularVelocity);
              existingTank.setTurretRotation(transform.turretRotation);
            } else {
              this.buildTank(transform.tankId);
            }
          },
          onUpdate: (_ctx: EventContext, _oldTransform: Infer<typeof TankTransformRow>, newTransform: Infer<typeof TankTransformRow>) => {
            if (newTransform.gameId !== this.gameId) return;
            const tank = this.tanks.get(newTransform.tankId);
            if (tank) {
              tank.setPosition(newTransform.positionX, newTransform.positionY, newTransform.updatedAt);
              tank.setTargetTurretRotation(newTransform.targetTurretRotation);
              tank.setTurretAngularVelocity(newTransform.turretAngularVelocity);
              tank.setTurretRotation(newTransform.turretRotation);
            }
          },
          onDelete: (_ctx: EventContext, transform: Infer<typeof TankTransformRow>) => {
            if (transform.gameId !== this.gameId) return;
            if (this.playerTankId === transform.tankId) {
              this.playerTankId = null;
            }
          }
        }
      })
      .add<typeof TankPathRow>({
        table: connection.db.tankPath,
        handlers: {
          onInsert: (_ctx: EventContext, tankPath: Infer<typeof TankPathRow>) => {
            if (tankPath.gameId !== this.gameId) return;
            const tank = this.tanks.get(tankPath.tankId);
            if (tank) {
              tank.setPath(tankPath.path);
            }
          },
          onUpdate: (_ctx: EventContext, _oldPath: Infer<typeof TankPathRow>, newPath: Infer<typeof TankPathRow>) => {
            if (newPath.gameId !== this.gameId) return;
            const tank = this.tanks.get(newPath.tankId);
            if (tank) {
              tank.setPath(newPath.path);
            }
          },
          onDelete: (_ctx: EventContext, tankPath: Infer<typeof TankPathRow>) => {
            if (tankPath.gameId !== this.gameId) return;
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

  buildTank(tankId: string) {
    const connection = getConnection();
    if (!connection) return;

    const tank = connection.db.tank.id.find(tankId);
    const transform = connection.db.tankTransform.tankId.find(tankId);
    
    if (!tank || !transform) return;

    const tankPath = connection.db.tankPath.tankId.find(tankId);
    const path = tankPath?.path ?? [];

    const newTank = new Tank(
      tank.id,
      transform.positionX,
      transform.positionY,
      transform.turretRotation,
      tank.name,
      tank.targetCode,
      tank.alliance,
      tank.health,
      tank.maxHealth,
      transform.turretAngularVelocity,
      path,
      tank.guns,
      tank.selectedGunIndex,
      tank.hasShield,
      tank.remainingImmunityMicros
    );

    this.tanks.set(tank.id, newTank);
    
    if (isCurrentIdentity(tank.owner) && tank.gameId == this.gameId) {
      this.playerTankId = tank.id;
      this.updatePlayerTarget(tank.target);
    }
  }

  private handleTankFire(fireState: Infer<typeof TankFireStateRow>) {
    const connection = getConnection();
    if (!connection) return;

    const tankRow = connection.db.tank.id.find(fireState.tankId);
    const transform = connection.db.tankTransform.tankId.find(fireState.tankId);
    
    if (tankRow && transform && tankRow.health > 0) {
      const barrelTipX =
        transform.positionX +
        Math.cos(transform.turretRotation) * GUN_BARREL_LENGTH;
      const barrelTipY =
        transform.positionY +
        Math.sin(transform.turretRotation) * GUN_BARREL_LENGTH;

      this.muzzleFlashManager.spawnMuzzleFlash(
        barrelTipX,
        barrelTipY,
        transform.turretRotation,
        tankRow.alliance
      );
      this.soundManager.play("fire", 0.4, transform.positionX, transform.positionY);
    }
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.tanks.clear();
    this.particlesManager.destroy();
    this.indicatorManager.destroy();
    this.muzzleFlashManager.destroy();
    this.targetingReticle.clearTank();
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

    ctx.textAlign = "center";

    const tanksWithTargetCodes: Array<{ tank: Tank, targetCode: string }> = [];
    const tanksWithoutTargetCodes: Tank[] = [];

    for (const tank of this.tanks.values()) {
      if (tank.getHealth() <= 0) continue;
      
      const isPlayerTank = tank.id === this.playerTankId;
      const isFriendly = playerAlliance !== null && tank.getAlliance() === playerAlliance;
      const targetCode = tank.getTargetCode();

      if (isPlayerTank || isFriendly || !targetCode) {
        tanksWithoutTargetCodes.push(tank);
      } else {
        tanksWithTargetCodes.push({ tank, targetCode });
      }
    }

    if (tanksWithTargetCodes.length > 0) {
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = COLORS.TERMINAL.WARNING;
      for (const { tank, targetCode } of tanksWithTargetCodes) {
        const pos = tank.getPosition();
        ctx.fillText(targetCode, pos.x * UNIT_TO_PIXEL, pos.y * UNIT_TO_PIXEL - 34);
      }
    }

    ctx.font = "12px monospace";
    ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;
    
    for (const { tank } of tanksWithTargetCodes) {
      const pos = tank.getPosition();
      ctx.fillText(tank.getName(), pos.x * UNIT_TO_PIXEL, pos.y * UNIT_TO_PIXEL - 20);
    }
    
    for (const tank of tanksWithoutTargetCodes) {
      const pos = tank.getPosition();
      ctx.fillText(tank.getName(), pos.x * UNIT_TO_PIXEL, pos.y * UNIT_TO_PIXEL - 27);
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
