import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { type EventContext } from "../../module_bindings";

interface PlayerScore {
  name: string;
  kills: number;
  deaths: number;
  score: number;
  alliance: number;
}

export class ScoreManager {
  private playerScores: Map<string, PlayerScore> = new Map();
  private maxScore: number = 1;
  private sortedPlayers: PlayerScore[] = [];
  private worldId: string;
  private isHomeworld: boolean;
  private handleTankInsert:
    | ((ctx: EventContext, tank: Infer<typeof TankRow>) => void)
    | null = null;
  private handleTankUpdate:
    | ((
        ctx: EventContext,
        oldTank: Infer<typeof TankRow>,
        newTank: Infer<typeof TankRow>
      ) => void)
    | null = null;
  private handleTankDelete:
    | ((ctx: EventContext, tank: Infer<typeof TankRow>) => void)
    | null = null;

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
      deaths: tank.deaths,
      score: Math.max(0, tank.kills - tank.deaths),
      alliance: tank.alliance,
    };
  }

  private updateLeaderboard() {
    let maxAbsScore = 1;
    for (const player of this.playerScores.values()) {
      const absScore = Math.abs(player.score);
      if (absScore > maxAbsScore) {
        maxAbsScore = absScore;
      }
    }
    this.maxScore = maxAbsScore;

    this.sortedPlayers.length = 0;
    for (const player of this.playerScores.values()) {
      this.sortedPlayers.push(player);
    }
    this.sortedPlayers.sort((a, b) => b.score - a.score);
  }

  private subscribeToTanks(worldId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tanks: connection not available");
      return;
    }

    this.handleTankInsert = (
      _ctx: EventContext,
      tank: Infer<typeof TankRow>
    ) => {
      if (tank.worldId !== worldId) return;
      this.playerScores.set(tank.id, ScoreManager.createPlayerScore(tank));
      this.updateLeaderboard();
    };

    this.handleTankUpdate = (
      _ctx: EventContext,
      _oldTank: Infer<typeof TankRow>,
      newTank: Infer<typeof TankRow>
    ) => {
      if (newTank.worldId !== worldId) return;
      this.playerScores.set(
        newTank.id,
        ScoreManager.createPlayerScore(newTank)
      );
      this.updateLeaderboard();
    };

    this.handleTankDelete = (
      _ctx: EventContext,
      tank: Infer<typeof TankRow>
    ) => {
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
      if (this.handleTankInsert)
        connection.db.tank.removeOnInsert(this.handleTankInsert);
      if (this.handleTankUpdate)
        connection.db.tank.removeOnUpdate(this.handleTankUpdate);
      if (this.handleTankDelete)
        connection.db.tank.removeOnDelete(this.handleTankDelete);
    }
  }
}
