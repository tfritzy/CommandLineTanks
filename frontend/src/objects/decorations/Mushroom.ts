import { UNIT_TO_PIXEL } from "../../constants";

export class Mushroom {
  private x: number;
  private y: number;
  private size: number;

  constructor(x: number, y: number, size: number) {
    this.x = x;
    this.y = y;
    this.size = size;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getSize(): number {
    return this.size;
  }

  public getGameX(): number {
    return this.x * UNIT_TO_PIXEL;
  }

  public getGameY(): number {
    return this.y * UNIT_TO_PIXEL;
  }
}
