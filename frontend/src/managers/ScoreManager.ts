import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { type EventContext } from "../../module_bindings";
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
  private isHomeworld: boolean = false;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.checkIfHomeworld();
    this.subscribeToTanks(worldId);
  }

  private checkIfHomeworld() {
    const connection = getConnection();
    if (!connection || !connection.identity) {
      this.isHomeworld = false;
      return;
    }
    
    const identityString = connection.identity.toHexString().toLowerCase();
    this.isHomeworld = identityString === this.worldId;
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

    connection
      .subscriptionBuilder()
      .onError((e) => console.error("Tank subscription error", e))
      .subscribe([`SELECT * FROM tank WHERE WorldId = '${worldId}'`]);

    connection.db.tank.onInsert((_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      this.playerScores.set(tank.id, ScoreManager.createPlayerScore(tank));
      this.updateLeaderboard();
    });

    connection.db.tank.onUpdate((_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
      this.playerScores.set(newTank.id, ScoreManager.createPlayerScore(newTank));
      this.updateLeaderboard();
    });

    connection.db.tank.onDelete((_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      this.playerScores.delete(tank.id);
      this.updateLeaderboard();
    });
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
