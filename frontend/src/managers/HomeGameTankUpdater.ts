import { getConnection } from "../spacetimedb-connection";
import type { EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import GameRow from "../../module_bindings/game_type";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import type { TankManager } from "./TankManager";

const ARRIVAL_THRESHOLD = 0.1;

export class HomeGameTankUpdater {
  private gameId: string;
  private tankManager: TankManager | null = null;
  private isHomeGame: boolean = false;
  private gameSubscription: TableSubscription<typeof GameRow> | null = null;
  private tankDataCache: Map<string, { topSpeed: number; turretRotationSpeed: number }> = new Map();

  constructor(gameId: string) {
    this.gameId = gameId;
    this.subscribeToGame();
  }

  public setTankManager(tankManager: TankManager) {
    this.tankManager = tankManager;
  }

  public isEnabled(): boolean {
    return this.isHomeGame;
  }

  private subscribeToGame() {
    const connection = getConnection();
    if (!connection) return;

    this.gameSubscription = subscribeToTable({
      table: connection.db.game,
      handlers: {
        onInsert: (_ctx: EventContext, game: Infer<typeof GameRow>) => {
          if (game.id !== this.gameId) return;
          this.isHomeGame = game.isHomeGame;
        },
        onUpdate: (_ctx: EventContext, _oldGame: Infer<typeof GameRow>, newGame: Infer<typeof GameRow>) => {
          if (newGame.id !== this.gameId) return;
          this.isHomeGame = newGame.isHomeGame;
        }
      },
      loadInitialData: false
    });

    const cachedGame = connection.db.game.Id.find(this.gameId);
    if (cachedGame) {
      this.isHomeGame = cachedGame.isHomeGame;
    }
  }

  private getTankData(tankId: string): { topSpeed: number; turretRotationSpeed: number } | null {
    const cached = this.tankDataCache.get(tankId);
    if (cached) return cached;

    const connection = getConnection();
    if (!connection) return null;

    const tankData = connection.db.tank.id.find(tankId);
    if (!tankData) return null;

    const data = {
      topSpeed: tankData.topSpeed,
      turretRotationSpeed: tankData.turretRotationSpeed
    };
    this.tankDataCache.set(tankId, data);
    return data;
  }

  public update(deltaTime: number) {
    if (!this.isHomeGame) return;
    if (!this.tankManager) return;

    for (const tank of this.tankManager.getAllTanks()) {
      if (tank.getHealth() <= 0) continue;

      const tankData = this.getTankData(tank.id);
      if (!tankData) continue;

      this.updatePathFollowing(tank, tankData.topSpeed, deltaTime);
      this.updateTurretRotation(tank, tankData.turretRotationSpeed, deltaTime);
    }
  }

  private updatePathFollowing(
    tank: { 
      id: string;
      getPosition(): { x: number; y: number };
      getPath(): Array<{ x: number; y: number }>;
      setPath(path: Array<{ x: number; y: number }>): void;
      setPositionDirect(x: number, y: number): void;
    },
    topSpeed: number,
    deltaTime: number
  ) {
    const path = tank.getPath();
    if (path.length === 0) return;

    const pos = tank.getPosition();
    const targetPos = path[0];
    const deltaX = targetPos.x - pos.x;
    const deltaY = targetPos.y - pos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const moveDistance = topSpeed * deltaTime;

    if (distance <= ARRIVAL_THRESHOLD || moveDistance >= distance) {
      const overshoot = moveDistance - distance;
      const newPath = path.slice(1);

      if (newPath.length > 0) {
        const nextTarget = newPath[0];
        const nextDeltaX = nextTarget.x - targetPos.x;
        const nextDeltaY = nextTarget.y - targetPos.y;
        const nextDistance = Math.sqrt(nextDeltaX * nextDeltaX + nextDeltaY * nextDeltaY);

        if (nextDistance > 0) {
          const nextDirX = nextDeltaX / nextDistance;
          const nextDirY = nextDeltaY / nextDistance;

          const finalX = targetPos.x + nextDirX * Math.min(overshoot, nextDistance);
          const finalY = targetPos.y + nextDirY * Math.min(overshoot, nextDistance);

          tank.setPositionDirect(finalX, finalY);
        } else {
          tank.setPositionDirect(targetPos.x, targetPos.y);
        }

        tank.setPath(newPath);
      } else {
        tank.setPositionDirect(targetPos.x, targetPos.y);
        tank.setPath([]);
      }
    } else {
      const dirX = deltaX / distance;
      const dirY = deltaY / distance;

      tank.setPositionDirect(
        pos.x + dirX * moveDistance,
        pos.y + dirY * moveDistance
      );
    }
  }

  private updateTurretRotation(
    tank: {
      getTurretRotation(): number;
      getTargetTurretRotation(): number;
      getTurretAngularVelocity(): number;
      setTurretRotation(rotation: number): void;
      setTurretAngularVelocity(velocity: number): void;
    },
    turretRotationSpeed: number,
    deltaTime: number
  ) {
    const turretRotation = tank.getTurretRotation();
    const targetTurretRotation = tank.getTargetTurretRotation();

    if (Math.abs(turretRotation - targetTurretRotation) <= 0.001) return;

    let angleDiff = targetTurretRotation - turretRotation;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    const rotationAmount = turretRotationSpeed * deltaTime;
    const turretAngularVelocity = tank.getTurretAngularVelocity();

    if (turretAngularVelocity === 0) {
      tank.setTurretAngularVelocity(Math.sign(angleDiff) * turretRotationSpeed);
    } else if (Math.abs(angleDiff) <= rotationAmount) {
      tank.setTurretRotation(targetTurretRotation);
      tank.setTurretAngularVelocity(0);
    } else {
      const signedRotation = Math.sign(angleDiff) * rotationAmount;
      let newRotation = turretRotation + signedRotation;
      while (newRotation > Math.PI) newRotation -= 2 * Math.PI;
      while (newRotation < -Math.PI) newRotation += 2 * Math.PI;
      tank.setTurretRotation(newRotation);
      tank.setTurretAngularVelocity(Math.sign(angleDiff) * turretRotationSpeed);
    }
  }

  public destroy() {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
      this.gameSubscription = null;
    }
    this.tankDataCache.clear();
  }
}
