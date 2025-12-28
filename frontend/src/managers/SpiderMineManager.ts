import { SpiderMine } from "../objects/SpiderMine";
import { getConnection } from "../spacetimedb-connection";
import { type SpiderMineRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";

export class SpiderMineManager {
  private spiderMines: Map<string, SpiderMine> = new Map();
  private worldId: string;
  private handleMineInsert: ((ctx: EventContext, mine: Infer<typeof SpiderMineRow>) => void) | null = null;
  private handleMineUpdate: ((ctx: EventContext, oldMine: Infer<typeof SpiderMineRow>, newMine: Infer<typeof SpiderMineRow>) => void) | null = null;
  private handleMineDelete: ((ctx: EventContext, mine: Infer<typeof SpiderMineRow>) => void) | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToSpiderMines();
  }

  private subscribeToSpiderMines() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Spider mine subscription error", e))
      .subscribe([`SELECT * FROM spider_mine WHERE WorldId = '${this.worldId}'`]);

    this.handleMineInsert = (_ctx: EventContext, mine: Infer<typeof SpiderMineRow>) => {
      if (mine.worldId !== this.worldId) return;
      const newMine = new SpiderMine(
        mine.id,
        mine.positionX,
        mine.positionY,
        mine.alliance,
        mine.health,
        mine.isPlanted,
        Number(mine.plantingStartedAt),
        mine.velocity.x,
        mine.velocity.y
      );
      this.spiderMines.set(mine.id, newMine);
    };

    this.handleMineUpdate = (_ctx: EventContext, _oldMine: Infer<typeof SpiderMineRow>, newMine: Infer<typeof SpiderMineRow>) => {
      if (newMine.worldId !== this.worldId) return;
      const mine = this.spiderMines.get(newMine.id);
      if (mine) {
        mine.setPosition(newMine.positionX, newMine.positionY);
        mine.setHealth(newMine.health);
        mine.setIsPlanted(newMine.isPlanted);
        mine.setPlantingStartedAt(Number(newMine.plantingStartedAt));
        mine.setVelocity(newMine.velocity.x, newMine.velocity.y);
      }
    };

    this.handleMineDelete = (_ctx: EventContext, mine: Infer<typeof SpiderMineRow>) => {
      if (mine.worldId !== this.worldId) return;
      this.spiderMines.delete(mine.id);
    };

    connection.db.spiderMine.onInsert(this.handleMineInsert);
    connection.db.spiderMine.onUpdate(this.handleMineUpdate);
    connection.db.spiderMine.onDelete(this.handleMineDelete);

    for (const mine of connection.db.spiderMine.iter()) {
      if (mine.worldId === this.worldId) {
        const newMine = new SpiderMine(
          mine.id,
          mine.positionX,
          mine.positionY,
          mine.alliance,
          mine.health,
          mine.isPlanted,
          Number(mine.plantingStartedAt),
          mine.velocity.x,
          mine.velocity.y
        );
        this.spiderMines.set(mine.id, newMine);
      }
    }
  }

  public update(deltaTime: number) {
    for (const mine of this.spiderMines.values()) {
      mine.update(deltaTime);
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    for (const mine of this.spiderMines.values()) {
      mine.draw(ctx);
    }
  }

  public getSpiderMines(): SpiderMine[] {
    return Array.from(this.spiderMines.values());
  }

  public getSpiderMine(id: string): SpiderMine | undefined {
    return this.spiderMines.get(id);
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleMineInsert) connection.db.spiderMine.removeOnInsert(this.handleMineInsert);
      if (this.handleMineUpdate) connection.db.spiderMine.removeOnUpdate(this.handleMineUpdate);
      if (this.handleMineDelete) connection.db.spiderMine.removeOnDelete(this.handleMineDelete);
    }
  }
}
