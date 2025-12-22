import { Tank } from "./objects/Tank";
import { getConnection } from "./spacetimedb-connection";
import { DeadTankParticlesManager } from "./DeadTankParticlesManager";

export class TankManager {
  private tanks: Map<string, Tank> = new Map();
  private playerTankId: string | null = null;
  private worldId: string;
  private particlesManager: DeadTankParticlesManager;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.particlesManager = new DeadTankParticlesManager();
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
      }
    });

    connection.db.tank.onUpdate((_ctx, oldTank, newTank) => {
      const tank = this.tanks.get(newTank.id);
      if (tank) {
        if (oldTank.health > 0 && newTank.health <= 0) {
          const pos = tank.getPosition();
          this.particlesManager.spawnParticles(pos.x, pos.y, newTank.alliance);
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
    });

    connection.db.tank.onDelete((_ctx, tank) => {
      this.tanks.delete(tank.id);

      if (this.playerTankId === tank.id && tank.worldId == this.worldId) {
        this.playerTankId = null;
      }
    });
  }

  public update(deltaTime: number) {
    for (const tank of this.tanks.values()) {
      tank.update(deltaTime);
    }
    this.particlesManager.update(deltaTime);
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

  public drawParticles(ctx: CanvasRenderingContext2D) {
    this.particlesManager.draw(ctx);
  }
}
