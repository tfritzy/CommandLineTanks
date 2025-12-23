import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { type EventContext } from "../../module_bindings";

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
    const color = player.alliance === 0 ? 'rgba(157, 67, 67, 0.8)' : 'rgba(90, 120, 178, 0.8)';
    const progress = player.kills / this.maxKills;
    const radius = barHeight / 2;

    ctx.save();

    // Background bar
    ctx.beginPath();
    ctx.roundRect(x - barWidth, y, barWidth, barHeight, radius);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Inset progress bar
    const inset = 1.5;
    if (progress > 0) {
      const innerWidth = (barWidth - inset * 2) * progress;
      const innerHeight = barHeight - inset * 2;
      const innerRadius = innerHeight / 2;
      ctx.beginPath();
      ctx.roundRect(x - barWidth + inset, y + inset, innerWidth, innerHeight, innerRadius);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.restore();

    const killText = player.kills === 1 ? 'kill' : 'kills';
    const text = `${player.name}  —  ${player.kills} ${killText}`;

    ctx.font = '800 14px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(text, x - barWidth / 2, y + barHeight / 2 + 1);

    ctx.fillStyle = '#fcfbf3';
    ctx.fillText(text, x - barWidth / 2, y + barHeight / 2 + 1);
  }
}
