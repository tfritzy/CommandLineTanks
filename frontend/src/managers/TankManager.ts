import { Tank } from "../objects/Tank";
import { SoundManager } from "./SoundManager";
import { getConnection, isCurrentIdentity } from "../spacetimedb-connection";
import { DeadTankParticlesManager } from "./DeadTankParticlesManager";
import { TankIndicatorManager } from "./TankIndicatorManager";
import { TargetingReticle } from "../objects/TargetingReticle";
import { ScreenShake } from "../utils/ScreenShake";
import { MuzzleFlashParticlesManager } from "./MuzzleFlashParticlesManager";
import { GUN_BARREL_LENGTH, UNIT_TO_PIXEL } from "../constants";
import { COLORS, PALETTE } from "../theme/colors";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import TankTransformRow from "../../module_bindings/tank_transform_type";
import TankFireStateRow from "../../module_bindings/tank_fire_state_type";
import TankPathRow from "../../module_bindings/tank_path_table";
import { createMultiTableSubscription, type MultiTableSubscription } from "../utils/tableSubscription";

const VIEWPORT_PADDING = 100;

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
              tank.setHasShield(newTank.hasShield);
              tank.setRemainingImmunityMicros(newTank.remainingImmunityMicros);
              tank.setMessage(newTank.message ?? null);
              tank.setAlliance(newTank.alliance);
              tank.setTargetCode(newTank.targetCode);
              tank.setName(newTank.name);
              tank.setMaxHealth(newTank.maxHealth);
              tank.setTopSpeed(newTank.topSpeed);
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
              existingTank.setPosition(transform.positionX, transform.positionY);
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
              tank.setPosition(newTransform.positionX, newTransform.positionY);
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
              tank.setPath(tankPath.path, tankPath.pathIndex);
            }
          },
          onUpdate: (_ctx: EventContext, _oldPath: Infer<typeof TankPathRow>, newPath: Infer<typeof TankPathRow>) => {
            if (newPath.gameId !== this.gameId) return;
            const tank = this.tanks.get(newPath.tankId);
            if (tank) {
              tank.setPath(newPath.path, newPath.pathIndex);
            }
          },
          onDelete: (_ctx: EventContext, tankPath: Infer<typeof TankPathRow>) => {
            if (tankPath.gameId !== this.gameId) return;
            const tank = this.tanks.get(tankPath.tankId);
            if (tank) {
              tank.setPath([], 0);
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
    const pathIndex = tankPath?.pathIndex ?? 0;

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
      pathIndex,
      tank.hasShield,
      tank.remainingImmunityMicros,
      tank.topSpeed
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

      const soundKey = this.getFireSoundForGunType(fireState.gunType);
      this.soundManager.play(soundKey, 0.4, transform.positionX, transform.positionY);
    }
  }

  private getFireSoundForGunType(gunType: Infer<typeof TankFireStateRow>['gunType']): string {
    switch (gunType.tag) {
      case 'Boomerang':
        return 'fire-boomerang';
      case 'Moag':
        return 'fire-moag';
      case 'MissileLauncher':
      case 'Rocket':
        return 'fire-rocket';
      default:
        return 'fire';
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

  public drawPaths(ctx: CanvasRenderingContext2D, viewportWidth: number, viewportHeight: number) {
    const playerTank = this.getPlayerTank();
    if (playerTank) {
      const dpr = window.devicePixelRatio || 1;
      const oldTransform = ctx.getTransform();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      const centerX = viewportWidth / 2 / UNIT_TO_PIXEL;
      const centerY = viewportHeight / 2 / UNIT_TO_PIXEL;
      const lineColor = playerTank.getAlliance() === 0 ? COLORS.GAME.TEAM_RED_BRIGHT + "66" : COLORS.GAME.TEAM_BLUE_BRIGHT + "66";
      const dotColor = playerTank.getAlliance() === 0 ? COLORS.GAME.TEAM_RED_BRIGHT + "ff" : COLORS.GAME.TEAM_BLUE_BRIGHT + "ff";
      const path = playerTank['path'];
      const pathIndex = playerTank['pathIndex'];
      const remainingPath = path.slice(pathIndex);
      
      if (remainingPath.length > 0) {
        const dotRadius = 5;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const startX = centerX * UNIT_TO_PIXEL;
        const startY = centerY * UNIT_TO_PIXEL;
        ctx.moveTo(startX, startY);
        
        for (const pathEntry of remainingPath) {
          const gameX = pathEntry.x * UNIT_TO_PIXEL;
          const gameY = pathEntry.y * UNIT_TO_PIXEL;
          ctx.lineTo(gameX, gameY);
        }
        
        ctx.stroke();
        
        const lastEntry = remainingPath[remainingPath.length - 1];
        const endX = lastEntry.x * UNIT_TO_PIXEL;
        const endY = lastEntry.y * UNIT_TO_PIXEL;
        
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(endX, endY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.setTransform(oldTransform);
    }
  }

  public drawShadows(ctx: CanvasRenderingContext2D, viewportWidth: number, viewportHeight: number) {
    const dpr = window.devicePixelRatio || 1;
    const centerX = viewportWidth / 2 / UNIT_TO_PIXEL;
    const centerY = viewportHeight / 2 / UNIT_TO_PIXEL;
    
    for (const tank of this.tanks.values()) {
      if (tank.id === this.playerTankId && tank.getHealth() > 0) {
        const oldTransform = ctx.getTransform();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        const px = centerX * UNIT_TO_PIXEL - 2;
        const py = centerY * UNIT_TO_PIXEL + 2;
        ctx.fillStyle = PALETTE.TRANSPARENT_SHADOW;
        ctx.beginPath();
        ctx.roundRect(px - 16, py - 16, 32, 32, 5);
        ctx.fill();
        
        ctx.setTransform(oldTransform);
      } else {
        tank.drawShadow(ctx);
      }
    }
  }

  public drawBodies(ctx: CanvasRenderingContext2D, viewportWidth: number, viewportHeight: number) {
    const dpr = window.devicePixelRatio || 1;
    const centerX = viewportWidth / 2 / UNIT_TO_PIXEL;
    const centerY = viewportHeight / 2 / UNIT_TO_PIXEL;
    
    for (const tank of this.tanks.values()) {
      if (tank.id === this.playerTankId && tank.getHealth() > 0) {
        const oldTransform = ctx.getTransform();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        const turretRotation = tank.getTurretRotation();
        const alliance = tank.getAlliance();
        const hasShield = tank['hasShield'];
        const isImmune = tank['remainingImmunityMicros'] > 0;
        const flashTimer = tank['flashTimer'];
        
        const allianceColor = alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
        const baseBorderColor = alliance === 0 ? "#330000" : "#000033";
        let bodyColor = allianceColor;
        let borderColor = baseBorderColor;
        
        if (flashTimer > 0) {
          const flashProgress = flashTimer / 0.15;
          const flashColorValue = Math.floor(flashProgress * 255);
          bodyColor = `rgb(${flashColorValue}, ${flashColorValue}, ${flashColorValue})`;
          borderColor = `rgb(${Math.floor(flashColorValue * 0.5)}, ${Math.floor(flashColorValue * 0.5)}, ${Math.floor(flashColorValue * 0.5)})`;
        }
        
        if (isImmune) {
          const flashCycle = Date.now() / 1000 / 0.2;
          const lerpAmount = Math.abs(Math.sin(flashCycle * Math.PI)) * 0.5 + 0.5;
          const groundColor = COLORS.TERRAIN.GROUND;
          const parseColor = (c: string) => {
            if (c.startsWith('#')) {
              const r = parseInt(c.slice(1, 3), 16);
              const g = parseInt(c.slice(3, 5), 16);
              const b = parseInt(c.slice(5, 7), 16);
              return [r, g, b];
            }
            return [0, 0, 0];
          };
          const [gr, gg, gb] = parseColor(groundColor);
          const [br, bg, bb] = parseColor(bodyColor);
          const nr = Math.floor(gr + (br - gr) * lerpAmount);
          const ng = Math.floor(gg + (bg - gg) * lerpAmount);
          const nb = Math.floor(gb + (bb - gb) * lerpAmount);
          bodyColor = `rgb(${nr}, ${ng}, ${nb})`;
          borderColor = `rgb(${Math.floor(nr * 0.5)}, ${Math.floor(ng * 0.5)}, ${Math.floor(nb * 0.5)})`;
        }
        
        const px = Math.floor(centerX * UNIT_TO_PIXEL);
        const py = Math.floor(centerY * UNIT_TO_PIXEL);
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(px - 15, py - 15, 30, 30, 5);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.save();
        ctx.translate(px - 2, py + 2);
        ctx.rotate(turretRotation);
        ctx.beginPath();
        ctx.roundRect(0, -5, 24, 10, 3);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.translate(px - 1.5, py + 1.5);
        ctx.rotate(turretRotation);
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(turretRotation);
        
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.roundRect(0, -5, 24, 10, 3);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        
        if (hasShield) {
          const shieldSize = 40;
          const shieldHalfSize = shieldSize / 2;
          ctx.strokeStyle = COLORS.TERMINAL.INFO;
          ctx.lineWidth = 2;
          ctx.fillStyle = "rgba(115, 150, 213, 0.25)";
          ctx.beginPath();
          ctx.roundRect(px - shieldHalfSize, py - shieldHalfSize, shieldSize, shieldSize, 5);
          ctx.fill();
          ctx.stroke();
        }
        
        ctx.setTransform(oldTransform);
      } else {
        tank.drawBody(ctx);
      }
    }
  }

  public drawHealthBars(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const paddedLeft = cameraX - VIEWPORT_PADDING;
    const paddedRight = cameraX + viewportWidth + VIEWPORT_PADDING;
    const paddedTop = cameraY - VIEWPORT_PADDING;
    const paddedBottom = cameraY + viewportHeight + VIEWPORT_PADDING;
    const dpr = window.devicePixelRatio || 1;
    const centerX = viewportWidth / 2 / UNIT_TO_PIXEL;
    const centerY = viewportHeight / 2 / UNIT_TO_PIXEL;

    for (const tank of this.tanks.values()) {
      if (tank.id === this.playerTankId && tank.getHealth() > 0) {
        const oldTransform = ctx.getTransform();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        const health = tank.getHealth();
        const maxHealth = tank['maxHealth'];
        if (health > 0 && health < maxHealth) {
          const px = centerX * UNIT_TO_PIXEL;
          const py = centerY * UNIT_TO_PIXEL;
          const allianceColor = tank.getAllianceColor();
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.beginPath();
          ctx.roundRect(px - 16, py + 24, 32, 4, 2);
          ctx.fill();
          
          const healthPercent = health / maxHealth;
          const healthBarWidth = 30 * healthPercent;
          
          ctx.fillStyle = allianceColor;
          ctx.beginPath();
          ctx.roundRect(px - 15, py + 25, healthBarWidth, 2, 2);
          ctx.fill();
        }
        
        ctx.setTransform(oldTransform);
      } else {
        const pos = tank.getPosition();
        const px = pos.x * UNIT_TO_PIXEL;
        const py = pos.y * UNIT_TO_PIXEL;
        
        if (px < paddedLeft || px > paddedRight || py < paddedTop || py > paddedBottom) continue;
        
        tank.drawHealthBar(ctx);
      }
    }
  }

  public drawNameLabels(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const playerTank = this.playerTankId ? this.tanks.get(this.playerTankId) : null;
    const playerAlliance = playerTank ? playerTank.getAlliance() : null;

    const paddedLeft = cameraX - VIEWPORT_PADDING;
    const paddedRight = cameraX + viewportWidth + VIEWPORT_PADDING;
    const paddedTop = cameraY - VIEWPORT_PADDING;
    const paddedBottom = cameraY + viewportHeight + VIEWPORT_PADDING;
    const dpr = window.devicePixelRatio || 1;
    const centerX = viewportWidth / 2 / UNIT_TO_PIXEL;
    const centerY = viewportHeight / 2 / UNIT_TO_PIXEL;

    ctx.textAlign = "center";

    ctx.font = "bold 16px monospace";
    ctx.fillStyle = COLORS.TERMINAL.WARNING;
    for (const tank of this.tanks.values()) {
      if (tank.getHealth() <= 0) continue;
      
      const isPlayerTank = tank.id === this.playerTankId;
      if (isPlayerTank) continue;
      
      const pos = tank.getPosition();
      const px = pos.x * UNIT_TO_PIXEL;
      const py = pos.y * UNIT_TO_PIXEL;
      
      if (px < paddedLeft || px > paddedRight || py < paddedTop || py > paddedBottom) continue;
      
      const isFriendly = playerAlliance !== null && tank.getAlliance() === playerAlliance;
      const targetCode = tank.getTargetCode();

      if (!isFriendly && targetCode) {
        ctx.fillText(targetCode, px, py - 34);
      }
    }

    ctx.font = "12px monospace";
    ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;
    for (const tank of this.tanks.values()) {
      if (tank.getHealth() <= 0) continue;
      
      const isPlayerTank = tank.id === this.playerTankId;
      
      if (isPlayerTank) {
        const oldTransform = ctx.getTransform();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const px = centerX * UNIT_TO_PIXEL;
        const py = centerY * UNIT_TO_PIXEL;
        ctx.fillText(tank.getName(), px, py - 27);
        ctx.setTransform(oldTransform);
      } else {
        const pos = tank.getPosition();
        const px = pos.x * UNIT_TO_PIXEL;
        const py = pos.y * UNIT_TO_PIXEL;
        
        if (px < paddedLeft || px > paddedRight || py < paddedTop || py > paddedBottom) continue;
        
        const isFriendly = playerAlliance !== null && tank.getAlliance() === playerAlliance;
        const targetCode = tank.getTargetCode();

        if (!isFriendly && targetCode) {
          ctx.fillText(tank.getName(), px, py - 20);
        } else {
          ctx.fillText(tank.getName(), px, py - 27);
        }
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
