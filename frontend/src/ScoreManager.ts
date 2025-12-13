import { getConnection } from "./spacetimedb-connection";

const MAX_SCORE = 100;

export class ScoreManager {
  private scores: number[] = [0, 0];

  constructor(worldId: string) {
    this.subscribeToScore(worldId);
  }

  private subscribeToScore(worldId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to score: connection not available");
      return;
    }

    connection
      .subscriptionBuilder()
      .onError((e) => console.error("Score subscription error", e))
      .subscribe([`SELECT * FROM score WHERE worldId = '${worldId}'`]);

    connection.db.score.onInsert((_ctx, score) => {
      console.log("Score inserted:", score);
      this.scores = [...score.kills];
    });

    connection.db.score.onUpdate((_ctx, _oldScore, newScore) => {
      console.log("Score updated:", newScore);
      this.scores = [...newScore.kills];
    });
  }

  public getScores(): number[] {
    return this.scores;
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number) {
    ctx.save();
    
    const padding = 20;
    const barWidth = 200;
    const barHeight = 20;
    const spacing = 10;
    const x = canvasWidth - padding;
    
    let y = padding + 20;
    y = this.drawTeamScore(ctx, 'Team Red', this.scores[0] || 0, '#ff6666', x, y, barWidth, barHeight, spacing);
    
    y += spacing + 20;
    this.drawTeamScore(ctx, 'Team Blue', this.scores[1] || 0, '#6666ff', x, y, barWidth, barHeight, spacing);
    
    ctx.restore();
  }

  private drawTeamScore(
    ctx: CanvasRenderingContext2D,
    teamName: string,
    score: number,
    color: string,
    x: number,
    y: number,
    barWidth: number,
    barHeight: number,
    spacing: number
  ): number {
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.fillText(`${teamName}: ${score}/${MAX_SCORE}`, x, y);
    
    y += spacing;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - barWidth, y, barWidth, barHeight);
    
    const progress = Math.min(score / MAX_SCORE, 1);
    ctx.fillStyle = color;
    ctx.fillRect(x - barWidth, y, barWidth * progress, barHeight);
    
    return y + barHeight;
  }
}
