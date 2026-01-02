import { UNIT_TO_PIXEL } from "../../constants";

export class Mushroom {
  private x: number;
  private y: number;
  private size: number;
  private rotation: number;
  private seed: number;

  constructor(x: number, y: number, size: number, rotation: number) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.rotation = rotation;
    this.seed = x * 7.77 + y * 3.33;
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

  public getRotation(): number {
    return this.rotation;
  }

  public getSeed(): number {
    return this.seed;
  }

  public getWorldX(): number {
    return this.x * UNIT_TO_PIXEL;
  }

  public getWorldY(): number {
    return this.y * UNIT_TO_PIXEL;
  }
}
