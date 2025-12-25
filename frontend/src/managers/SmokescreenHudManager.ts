import { getConnection } from "../spacetimedb-connection";
import { type EventContext } from "../../module_bindings";
import { drawSmokescreenHud } from "../drawing/ui/smokescreen-hud";

export class SmokescreenHudManager {
  private cooldownEnd: bigint = 0n;
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
        this.cooldownEnd = tank.smokescreenCooldownEnd;
      }
    });

    connection.db.tank.onUpdate((_ctx: EventContext, _oldTank, newTank) => {
      if (connection.identity && newTank.owner.isEqual(connection.identity) && newTank.worldId === worldId) {
        this.cooldownEnd = newTank.smokescreenCooldownEnd;
      }
    });

    connection.db.tank.onDelete((_ctx: EventContext, tank) => {
      if (this.playerTankId === tank.id) {
        this.playerTankId = null;
        this.cooldownEnd = 0n;
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    if (this.playerTankId === null) {
      return;
    }

    const currentTime = BigInt(Date.now() * 1000);
    const isReady = this.cooldownEnd <= currentTime;
    const cooldownRemaining = isReady ? 0 : Number(this.cooldownEnd - currentTime) / 1_000_000;

    const progress = isReady ? 1 : Math.max(0, 1 - (cooldownRemaining / 60));
    
    drawSmokescreenHud(ctx, progress, cooldownRemaining, canvasWidth, canvasHeight);
  }
}
