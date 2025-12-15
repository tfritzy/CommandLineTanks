import { Tank } from "./objects/Tank";
import { getConnection } from "./spacetimedb-connection";

export class TankManager {
  private tanks: Map<string, Tank> = new Map();
  private playerTankId: string | null = null;
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
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
      console.log(tank);
      const newTank = new Tank(
        tank.positionX,
        tank.positionY,
        tank.bodyRotation,
        tank.targetBodyRotation,
        tank.turretRotation,
        tank.name,
        tank.alliance,
        tank.health,
        tank.maxHealth,
        tank.velocity.x,
        tank.velocity.y,
        tank.bodyAngularVelocity,
        tank.turretAngularVelocity,
        tank.path
      );
      this.tanks.set(tank.id, newTank);
      
      if (connection.identity && tank.owner.isEqual(connection.identity)) {
        this.playerTankId = tank.id;
      }
    });

    connection.db.tank.onUpdate((_ctx, _oldTank, newTank) => {
      console.log(newTank);
      const tank = this.tanks.get(newTank.id);
      if (tank) {
        tank.setPosition(newTank.positionX, newTank.positionY);
        tank.setBodyRotation(newTank.bodyRotation);
        tank.setTargetBodyRotation(newTank.targetBodyRotation);
        tank.setTargetTurretRotation(newTank.targetTurretRotation);
        tank.setVelocity(newTank.velocity.x, newTank.velocity.y);
        tank.setBodyAngularVelocity(newTank.bodyAngularVelocity);
        tank.setTurretAngularVelocity(newTank.turretAngularVelocity);
        tank.setPath(newTank.path);
        tank.setHealth(newTank.health);
      }
    });

    connection.db.tank.onDelete((_ctx, tank) => {
      console.log(tank);
      this.tanks.delete(tank.id);
      if (this.playerTankId === tank.id) {
        this.playerTankId = null;
      }
    });
  }

  public update(deltaTime: number) {
    for (const tank of this.tanks.values()) {
      tank.update(deltaTime);
    }
  }

  public getPlayerTank(): Tank | null {
    return this.playerTankId ? this.tanks.get(this.playerTankId) || null : null;
  }

  public getAllTanks(): IterableIterator<Tank> {
    return this.tanks.values();
  }
}
