import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { type EventContext, type SubscriptionHandle } from "../../module_bindings";
import { drawPlayerScore } from "../drawing/ui/scoreboard";

interface PlayerScore {
  name: string;
  kills: number;
  alliance: number;
}

export class ScoreManager {
  private playerScores: Map<string, PlayerScore> = new Map();
  private maxKills: number = 1;
  private sortedPlayers: PlayerScore[] = [];
  private worldId: string;
  private isHomeworld: boolean;
  private subscriptionHandle: SubscriptionHandle | null = null;
  private handleTankInsert: ((ctx: EventContext, tank: Infer<typeof TankRow>) => void) | null = null;
  private handleTankUpdate: ((ctx: EventContext, oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => void) | null = null;
  private handleTankDelete: ((ctx: EventContext, tank: Infer<typeof TankRow>) => void) | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    
    const connection = getConnection();
    this.isHomeworld = connection?.identity 
      ? connection.identity.toHexString().toLowerCase() === worldId
      : false;
    
    this.subscribeToTanks(this.worldId);
  }

  private static createPlayerScore(tank: Infer<typeof TankRow>): PlayerScore {
    return {
      name: tank.name,
      kills: tank.kills,
      alliance: tank.alliance
    };
  }

  private updateLeaderboard() {
    const allKills = Array.from(this.playerScores.values()).map(p => p.kills);
    this.maxKills = allKills.length > 0 ? Math.max(1, ...allKills) : 1;
    this.sortedPlayers = Array.from(this.playerScores.values())
      .sort((a, b) => b.kills - a.kills);
  }

  private subscribeToTanks(worldId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tanks: connection not available");
      return;
    }

    this.subscriptionHandle = connection
      .subscriptionBuilder()
      .onError((e) => console.error("Tank subscription error", e))
      .subscribe([`SELECT * FROM tank WHERE WorldId = '${worldId}'`]);

    this.handleTankInsert = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (tank.worldId !== worldId) return;
      this.playerScores.set(tank.id, ScoreManager.createPlayerScore(tank));
      this.updateLeaderboard();
    };

    this.handleTankUpdate = (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
      if (newTank.worldId !== worldId) return;
      this.playerScores.set(newTank.id, ScoreManager.createPlayerScore(newTank));
      this.updateLeaderboard();
    };

    this.handleTankDelete = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (tank.worldId !== worldId) return;
      this.playerScores.delete(tank.id);
      this.updateLeaderboard();
    };

    connection.db.tank.onInsert(this.handleTankInsert);
    connection.db.tank.onUpdate(this.handleTankUpdate);
    connection.db.tank.onDelete(this.handleTankDelete);

    for (const tank of connection.db.tank.iter()) {
      if (tank.worldId === worldId) {
        this.playerScores.set(tank.id, ScoreManager.createPlayerScore(tank));
      }
    }
    this.updateLeaderboard();
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleTankInsert) connection.db.tank.removeOnInsert(this.handleTankInsert);
      if (this.handleTankUpdate) connection.db.tank.removeOnUpdate(this.handleTankUpdate);
      if (this.handleTankDelete) connection.db.tank.removeOnDelete(this.handleTankDelete);
    }

    if (this.subscriptionHandle) {
      this.subscriptionHandle.unsubscribe();
    }
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number) {
    if (this.isHomeworld) {
      return;
    }
    
    ctx.save();
    
    const padding = 10;
    const barWidth = 250;
    const barHeight = 26;
    const spacing = 5;
    const x = canvasWidth - padding;
    let y = padding;

    for (const player of this.sortedPlayers) {
      this.drawPlayerScore(ctx, player, x, y, barWidth, barHeight);
      y += barHeight + spacing;
    }
    
    ctx.restore();
  }

  private drawPlayerScore(
    ctx: CanvasRenderingContext2D,
    player: PlayerScore,
    x: number,
    y: number,
    barWidth: number,
    barHeight: number
  ) {
    drawPlayerScore(ctx, player.name, player.kills, player.alliance, x, y, barWidth, barHeight, this.maxKills);
  }
}
