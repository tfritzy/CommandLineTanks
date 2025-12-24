import { Tank } from "../objects/Tank";
import { getConnection } from "../spacetimedb-connection";
import { DeadTankParticlesManager } from "./DeadTankParticlesManager";
import { TankIndicatorManager } from "./TankIndicatorManager";
import { TargetingReticle } from "../objects/TargetingReticle";

export class TankManager {
  private tanks: Map<string, Tank> = new Map();
  private playerTankId: string | null = null;
  private playerTargetTankId: string | null = null;
  private currentTargetingReticle: TargetingReticle | null = null;
  private worldId: string;
  private particlesManager: DeadTankParticlesManager;
  private indicatorManager: TankIndicatorManager;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.particlesManager = new DeadTankParticlesManager();
    this.indicatorManager = new TankIndicatorManager();
    this.subscribeToTanks();
  }

  private subscribeToTanks() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Ah fuck", e))
      .subscribe([`SELECT * FROM tank WHERE WorldId = '${this.worldId}'`]);

    connection.db.tank.onInsert((_ctx, tank) => {
      const newTank = new Tank(
        tank.id,
        tank.positionX,
        tank.positionY,
        tank.turretRotation,
        tank.name,
        tank.alliance,
        tank.health,
        tank.maxHealth,
        tank.velocity.x,
        tank.velocity.y,
        tank.turretAngularVelocity,
        tank.path,
        tank.guns,
        tank.selectedGunIndex
      );
      this.tanks.set(tank.id, newTank);

      if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId == this.worldId) {
        this.playerTankId = tank.id;
        this.updatePlayerTarget(tank.target);
      }
    });

    connection.db.tank.onUpdate((_ctx, oldTank, newTank) => {
      const tank = this.tanks.get(newTank.id);
      if (tank) {
        if (oldTank.health > 0 && newTank.health <= 0) {
          const pos = tank.getPosition();
          this.particlesManager.spawnParticles(pos.x, pos.y, newTank.alliance);
        }

        if (oldTank.target !== null && newTank.target === null && newTank.health > 0) {
          const pos = tank.getPosition();
          this.indicatorManager.spawnFloatingLabel(pos.x, pos.y - 0.5, "Target lost");
        }
        
        tank.setPosition(newTank.positionX, newTank.positionY);
        tank.setTargetTurretRotation(newTank.targetTurretRotation);
        tank.setVelocity(newTank.velocity.x, newTank.velocity.y);
        tank.setTurretAngularVelocity(newTank.turretAngularVelocity);
        tank.setPath(newTank.path);
        tank.setHealth(newTank.health);
        tank.setAlliance(newTank.alliance);
        tank.setGuns(newTank.guns);
        tank.setSelectedGunIndex(newTank.selectedGunIndex);
      }

      if (connection.identity && newTank.owner.isEqual(connection.identity) && newTank.worldId == this.worldId) {
        if (oldTank.target !== newTank.target) {
          this.updatePlayerTarget(newTank.target);
        }
      }
    });

    connection.db.tank.onDelete((_ctx, tank) => {
      this.tanks.delete(tank.id);

      if (this.playerTankId === tank.id && tank.worldId == this.worldId) {
        this.playerTankId = null;
      }

      if (this.playerTargetTankId === tank.id && tank.worldId == this.worldId) {
        this.updatePlayerTarget(null);
      }
    });
  }

  private updatePlayerTarget(targetId: string | null | undefined) {
    const newTargetId = targetId ?? null;
    
    if (this.playerTargetTankId === newTargetId) {
      return;
    }

    this.playerTargetTankId = newTargetId;

    if (this.currentTargetingReticle) {
      this.currentTargetingReticle.kill();
      this.currentTargetingReticle = null;
    }

    if (this.playerTargetTankId) {
      const targetedTank = this.tanks.get(this.playerTargetTankId);
      if (targetedTank) {
        this.currentTargetingReticle = new TargetingReticle(targetedTank);
        this.indicatorManager.addIndicator(this.currentTargetingReticle);
      }
    }
  }

  public update(deltaTime: number) {
    for (const tank of this.tanks.values()) {
      tank.update(deltaTime);
    }
    this.particlesManager.update(deltaTime);
    this.indicatorManager.update(deltaTime);
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

  public drawTankIndicators(ctx: CanvasRenderingContext2D) {
    this.indicatorManager.draw(ctx);
  }

  public drawParticles(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number) {
    this.particlesManager.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
  }
}
