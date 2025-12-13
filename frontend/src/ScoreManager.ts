import { getConnection } from "./spacetimedb-connection";

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
}
