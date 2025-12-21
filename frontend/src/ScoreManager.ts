import { getConnection } from "./spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../module_bindings/tank_type";
import { type EventContext } from "../module_bindings";

interface PlayerScore {
  name: string;
  kills: number;
  alliance: number;
}

export class ScoreManager {
  private playerScores: Map<string, PlayerScore> = new Map();
  private maxKills: number = 10;
  private sortedPlayers: PlayerScore[] = [];

  constructor(worldId: string) {
    this.subscribeToTanks(worldId);
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
    this.maxKills = allKills.length > 0 ? Math.max(10, ...allKills) : 10;
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
    ctx.save();
    
    const padding = 20;
    const barWidth = 250;
    const barHeight = 30;
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
    const color = player.alliance === 0 ? '#ff6666' : '#6666ff';
    const progress = player.kills / this.maxKills;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - barWidth, y, barWidth, barHeight);

    ctx.fillStyle = color;
    ctx.fillRect(x - barWidth, y, barWidth * progress, barHeight);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - barWidth, y, barWidth, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const killText = player.kills === 1 ? 'kill' : 'kills';
    ctx.fillText(`${player.name}: ${player.kills} ${killText}`, x - barWidth + 10, y + barHeight / 2);
  }
}
