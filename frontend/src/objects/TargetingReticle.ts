import { UNIT_TO_PIXEL } from "../game";
import type { TankIndicator } from "./TankIndicator";
import type { Tank } from "./Tank";

const RETICLE_SIZE = 24;
const RETICLE_GAP = 8;
const RETICLE_CORNER_LENGTH = 10;
const RETICLE_COLOR = "#fceba8";
const RETICLE_LINE_WIDTH = 2;

export class TargetingReticle implements TankIndicator {
  private tank: Tank;

  constructor(tank: Tank) {
    this.tank = tank;
  }

  public update(_deltaTime: number): void {
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.tank.getHealth() <= 0) return;

    const pos = this.tank.getPosition();
    const x = pos.x * UNIT_TO_PIXEL;
    const y = pos.y * UNIT_TO_PIXEL;

    ctx.save();
    ctx.strokeStyle = RETICLE_COLOR;
    ctx.lineWidth = RETICLE_LINE_WIDTH;

    ctx.beginPath();
    ctx.moveTo(x - RETICLE_SIZE - RETICLE_GAP, y - RETICLE_SIZE - RETICLE_GAP);
    ctx.lineTo(x - RETICLE_SIZE - RETICLE_GAP + RETICLE_CORNER_LENGTH, y - RETICLE_SIZE - RETICLE_GAP);
    ctx.moveTo(x - RETICLE_SIZE - RETICLE_GAP, y - RETICLE_SIZE - RETICLE_GAP);
    ctx.lineTo(x - RETICLE_SIZE - RETICLE_GAP, y - RETICLE_SIZE - RETICLE_GAP + RETICLE_CORNER_LENGTH);

    ctx.moveTo(x + RETICLE_SIZE + RETICLE_GAP, y - RETICLE_SIZE - RETICLE_GAP);
    ctx.lineTo(x + RETICLE_SIZE + RETICLE_GAP - RETICLE_CORNER_LENGTH, y - RETICLE_SIZE - RETICLE_GAP);
    ctx.moveTo(x + RETICLE_SIZE + RETICLE_GAP, y - RETICLE_SIZE - RETICLE_GAP);
    ctx.lineTo(x + RETICLE_SIZE + RETICLE_GAP, y - RETICLE_SIZE - RETICLE_GAP + RETICLE_CORNER_LENGTH);

    ctx.moveTo(x - RETICLE_SIZE - RETICLE_GAP, y + RETICLE_SIZE + RETICLE_GAP);
    ctx.lineTo(x - RETICLE_SIZE - RETICLE_GAP + RETICLE_CORNER_LENGTH, y + RETICLE_SIZE + RETICLE_GAP);
    ctx.moveTo(x - RETICLE_SIZE - RETICLE_GAP, y + RETICLE_SIZE + RETICLE_GAP);
    ctx.lineTo(x - RETICLE_SIZE - RETICLE_GAP, y + RETICLE_SIZE + RETICLE_GAP - RETICLE_CORNER_LENGTH);

    ctx.moveTo(x + RETICLE_SIZE + RETICLE_GAP, y + RETICLE_SIZE + RETICLE_GAP);
    ctx.lineTo(x + RETICLE_SIZE + RETICLE_GAP - RETICLE_CORNER_LENGTH, y + RETICLE_SIZE + RETICLE_GAP);
    ctx.moveTo(x + RETICLE_SIZE + RETICLE_GAP, y + RETICLE_SIZE + RETICLE_GAP);
    ctx.lineTo(x + RETICLE_SIZE + RETICLE_GAP, y + RETICLE_SIZE + RETICLE_GAP - RETICLE_CORNER_LENGTH);
    ctx.stroke();

    ctx.restore();
  }

  public getIsDead(): boolean {
    return this.tank.getHealth() <= 0;
  }
}
