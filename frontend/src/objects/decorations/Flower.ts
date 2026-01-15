import { UNIT_TO_PIXEL } from "../../constants";

export class Flower {
  private x: number;
  private y: number;
  private variation: number;

  constructor(x: number, y: number, variation: number) {
    this.x = x;
    this.y = y;
    this.variation = variation;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getVariation(): number {
    return this.variation;
  }

  public getGameX(): number {
    return this.x * UNIT_TO_PIXEL;
  }

  public getGameY(): number {
    return this.y * UNIT_TO_PIXEL;
  }
}
