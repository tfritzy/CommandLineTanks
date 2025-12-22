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
  private maxKills: number = 1;
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
    this.maxKills = allKills.length > 0 ? Math.max(...allKills) : 1;
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
    const barHeight = 22;
    const spacing = 10;
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
    const radius = barHeight / 2;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(x - barWidth + radius, y);
    ctx.arcTo(x, y, x, y + barHeight, radius);
    ctx.arcTo(x, y + barHeight, x - barWidth, y + barHeight, radius);
    ctx.arcTo(x - barWidth, y + barHeight, x - barWidth, y, radius);
    ctx.arcTo(x - barWidth, y, x, y, radius);
    ctx.closePath();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();

    ctx.clip();

    ctx.beginPath();
    ctx.moveTo(x - barWidth + radius, y);
    ctx.arcTo(x - barWidth + barWidth * progress, y, x - barWidth + barWidth * progress, y + barHeight, radius);
    ctx.arcTo(x - barWidth + barWidth * progress, y + barHeight, x - barWidth, y + barHeight, radius);
    ctx.arcTo(x - barWidth, y + barHeight, x - barWidth, y, radius);
    ctx.arcTo(x - barWidth, y, x - barWidth + barWidth * progress, y, radius);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();

    const killText = player.kills === 1 ? 'kill' : 'kills';
    const text = `${player.name}: ${player.kills} ${killText}`;

    ctx.font = '800 14px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(text, x - barWidth / 2, y + barHeight / 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x - barWidth / 2, y + barHeight / 2);
  }
}
