import { drawSpiderMineShadow, drawSpiderMineBody } from "../drawing/entities/spider-mine";

export class SpiderMine {
  public arrayIndex: number = -1;
  public readonly id: string;
  private x: number;
  private y: number;
  private alliance: number;
  private health: number;
  private isPlanted: boolean;
  private plantingStartedAt: number;
  private velocityX: number;
  private velocityY: number;

  constructor(
    id: string,
    x: number,
    y: number,
    alliance: number,
    health: number,
    isPlanted: boolean,
    plantingStartedAt: number,
    velocityX: number = 0,
    velocityY: number = 0
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.alliance = alliance;
    this.health = health;
    this.isPlanted = isPlanted;
    this.plantingStartedAt = plantingStartedAt;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;

    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public drawShadow(ctx: CanvasRenderingContext2D) {
    drawSpiderMineShadow(ctx, this.x, this.y);
  }

  public drawBody(ctx: CanvasRenderingContext2D) {
    drawSpiderMineBody(ctx, this.x, this.y, this.alliance);
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public setVelocity(velocityX: number, velocityY: number) {
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  public setHealth(health: number) {
    this.health = health;
  }

  public setIsPlanted(isPlanted: boolean) {
    this.isPlanted = isPlanted;
  }

  public setPlantingStartedAt(plantingStartedAt: number) {
    this.plantingStartedAt = plantingStartedAt;
  }

  public update(deltaTime: number) {
    if (this.velocityX !== 0 || this.velocityY !== 0) {
      this.x += this.velocityX * deltaTime;
      this.y += this.velocityY * deltaTime;
    }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public getHealth(): number {
    return this.health;
  }

  public getIsPlanted(): boolean {
    return this.isPlanted;
  }

  public getPlantingStartedAt(): number {
    return this.plantingStartedAt;
  }
}
