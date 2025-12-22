import { UNIT_TO_PIXEL } from "../game";
import { FLASH_DURATION } from "../utils/colors";
import { type TerrainDetailRow } from "../../module_bindings";
import { type Infer } from "spacetimedb";

export abstract class TerrainDetailObject {
  public arrayIndex: number = -1;
  protected x: number;
  protected y: number;
  protected label: string | undefined;
  protected health: number | undefined;
  protected rotation: number;
  protected flashTimer: number = 0;

  public setData(data: Infer<typeof TerrainDetailRow>): void {
    this.x = data.positionX;
    this.y = data.positionY;
    this.label = data.label;
    this.setHealth(data.health);
    this.rotation = data.rotation;
  }

  protected getRadius(baseRadius: number, variation: number, seedX: number, seedY: number): number {
    const seed = this.x * seedX + this.y * seedY;
    const pseudoRandom = (Math.abs(Math.sin(seed) * 10000) % 1) * (variation * 2) - variation;
    return UNIT_TO_PIXEL * baseRadius * (1.0 + pseudoRandom);
  }

  constructor(x: number, y: number, label: string | undefined = undefined, health: number | undefined = undefined, rotation: number = 0) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.health = health;
    this.rotation = rotation;
  }

  public update(deltaTime: number): void {
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - deltaTime);
    }
  }

  public setHealth(health: number | undefined): void {
    if (health !== undefined && this.health !== undefined && health < this.health) {
      this.flashTimer = FLASH_DURATION;
    }
    this.health = health;
  }

  public abstract draw(ctx: CanvasRenderingContext2D): void;

  public abstract drawShadow(ctx: CanvasRenderingContext2D): void;

  public abstract drawBody(ctx: CanvasRenderingContext2D): void;

  protected drawLabel(ctx: CanvasRenderingContext2D): void {
    if (!this.label) return;

    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const labelY = y - UNIT_TO_PIXEL * 0.6;

    ctx.font = `${UNIT_TO_PIXEL * .5}px sans-serif`;
    ctx.fillStyle = "#e6eeed";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    ctx.fillText(this.label, centerX, labelY);

    ctx.restore();
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getRotation(): number {
    return this.rotation;
  }

  public getFlashTimer(): number {
    return this.flashTimer;
  }

  protected getWorldX(): number {
    return this.x * UNIT_TO_PIXEL;
  }

  protected getWorldY(): number {
    return this.y * UNIT_TO_PIXEL;
  }
}
