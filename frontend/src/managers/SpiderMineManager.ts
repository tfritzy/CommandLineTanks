import { SpiderMine } from "../objects/SpiderMine";
import { getConnection } from "../spacetimedb-connection";

export class SpiderMineManager {
  private spiderMines: Map<string, SpiderMine> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToSpiderMines();
  }

  private subscribeToSpiderMines() {
    const connection = getConnection();
    if (!connection) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spiderMineTable = (connection.db as any).spiderMine;
    if (!spiderMineTable) {
      return;
    }

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Spider mine subscription error", e))
      .subscribe([`SELECT * FROM spider_mine WHERE WorldId = '${this.worldId}'`]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spiderMineTable.onInsert((_ctx: any, mine: any) => {
      const newMine = new SpiderMine(
        mine.id,
        mine.positionX,
        mine.positionY,
        mine.alliance,
        mine.health,
        mine.isPlanted,
        mine.plantingStartedAt,
        mine.velocity?.x ?? 0,
        mine.velocity?.y ?? 0
      );
      this.spiderMines.set(mine.id, newMine);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spiderMineTable.onUpdate((_ctx: any, _oldMine: any, newMine: any) => {
      const mine = this.spiderMines.get(newMine.id);
      if (mine) {
        mine.setPosition(newMine.positionX, newMine.positionY);
        mine.setHealth(newMine.health);
        mine.setIsPlanted(newMine.isPlanted);
        mine.setPlantingStartedAt(newMine.plantingStartedAt);
        mine.setVelocity(newMine.velocity?.x ?? 0, newMine.velocity?.y ?? 0);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spiderMineTable.onDelete((_ctx: any, mine: any) => {
      this.spiderMines.delete(mine.id);
    });
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
}
