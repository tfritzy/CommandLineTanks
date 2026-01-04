import { getConnection } from "../spacetimedb-connection";
import { type EventContext } from "../../module_bindings";
import { drawSmokescreenHud } from "../drawing/ui/smokescreen-hud";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";

export class SmokescreenHudManager {
  private remainingCooldownMicros: bigint = 0n;
  private playerTankId: string | null = null;
  private subscription: TableSubscription<typeof TankRow> | null = null;

  constructor(worldId: string) {
    this.subscribeToPlayerTank(worldId);
  }

  private subscribeToPlayerTank(worldId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tank: connection not available");
      return;
    }

    this.subscription = subscribeToTable({
      table: connection.db.tank,
      handlers: {
        onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId === worldId) {
            this.playerTankId = tank.id;
            this.remainingCooldownMicros = tank.remainingSmokescreenCooldownMicros;
          }
        },
        onUpdate: (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
          if (connection.identity && newTank.owner.isEqual(connection.identity) && newTank.worldId === worldId) {
            this.remainingCooldownMicros = newTank.remainingSmokescreenCooldownMicros;
          }
        },
        onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (this.playerTankId === tank.id) {
            this.playerTankId = null;
            this.remainingCooldownMicros = 0n;
          }
        }
      }
    });
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
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
