import { Drawable } from "../types/Drawable";

export class DrawableManager<T extends Drawable> {
  protected items: T[] = [];

  public add(item: T): void {
    this.items.push(item);
  }

  public update(deltaTime: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].update(deltaTime);
      if (this.items[i].getIsDead()) {
        this.items.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, ...args: any[]): void {
    for (const item of this.items) {
      item.draw(ctx, ...args);
    }
  }
}
