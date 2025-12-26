import { getConnection } from "../spacetimedb-connection";
import { type EventContext } from "../../module_bindings";
import { drawSmokescreenHud } from "../drawing/ui/smokescreen-hud";

export class SmokescreenHudManager {
  private remainingCooldownMicros: bigint = 0n;
  private playerTankId: string | null = null;

  constructor(worldId: string) {
    this.subscribeToPlayerTank(worldId);
  }

  private subscribeToPlayerTank(worldId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tank: connection not available");
      return;
    }

    connection.db.tank.onInsert((_ctx: EventContext, tank) => {
      if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId === worldId) {
        this.playerTankId = tank.id;
        this.remainingCooldownMicros = tank.remainingSmokescreenCooldownMicros;
      }
    });

    connection.db.tank.onUpdate((_ctx: EventContext, _oldTank, newTank) => {
      if (connection.identity && newTank.owner.isEqual(connection.identity) && newTank.worldId === worldId) {
        this.remainingCooldownMicros = newTank.remainingSmokescreenCooldownMicros;
      }
    });

    connection.db.tank.onDelete((_ctx: EventContext, tank) => {
      if (this.playerTankId === tank.id) {
        this.playerTankId = null;
        this.remainingCooldownMicros = 0n;
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    if (this.playerTankId === null) {
      return;
    }

    const isReady = this.remainingCooldownMicros <= 0n;
    const cooldownRemaining = isReady ? 0 : Number(this.remainingCooldownMicros) / 1_000_000;

    const progress = isReady ? 1 : Math.max(0, 1 - (cooldownRemaining / 60));
    
    drawSmokescreenHud(ctx, progress, cooldownRemaining, canvasWidth, canvasHeight);
  }
}
