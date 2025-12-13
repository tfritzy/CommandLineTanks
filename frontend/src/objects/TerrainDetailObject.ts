import { UNIT_TO_PIXEL } from "../game";

export abstract class TerrainDetailObject {
  protected x: number;
  protected y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public abstract draw(ctx: CanvasRenderingContext2D): void;

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  protected getWorldX(): number {
    return this.x * UNIT_TO_PIXEL;
  }

  protected getWorldY(): number {
    return this.y * UNIT_TO_PIXEL;
  }
}
