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

  constructor(worldId: string) {
    this.subscribeToTanks(worldId);
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
      this.playerScores.set(tank.id, {
        name: tank.name,
        kills: tank.kills,
        alliance: tank.alliance
      });
    });

    connection.db.tank.onUpdate((_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
      this.playerScores.set(newTank.id, {
        name: newTank.name,
        kills: newTank.kills,
        alliance: newTank.alliance
      });
    });

    connection.db.tank.onDelete((_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      this.playerScores.delete(tank.id);
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

    const sortedPlayers = Array.from(this.playerScores.values())
      .sort((a, b) => b.kills - a.kills);

    for (const player of sortedPlayers) {
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
    const maxKills = Math.max(10, ...Array.from(this.playerScores.values()).map(p => p.kills));
    const progress = player.kills / maxKills;

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
    ctx.fillText(`${player.name}: ${player.kills}`, x - barWidth + 10, y + barHeight / 2);
  }
}
