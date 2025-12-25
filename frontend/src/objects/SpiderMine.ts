import { UNIT_TO_PIXEL } from "../game";
import { TEAM_COLORS } from "../constants";

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
    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL - 4, this.y * UNIT_TO_PIXEL + 4);
    
    const radius = 8;
    const legLength = 12;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const legX = Math.cos(angle) * legLength;
      const legY = Math.sin(angle) * legLength;
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(legX, legY);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL, this.y * UNIT_TO_PIXEL);
    
    const radius = 8;
    const legLength = 12;
    const allianceColor = this.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
    
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const legX = Math.cos(angle) * legLength;
      const legY = Math.sin(angle) * legLength;
      const midX = Math.cos(angle) * radius;
      const midY = Math.sin(angle) * radius;
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#2e2e43";
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(legX * 0.7, legY * 0.7);
      ctx.lineTo(legX, legY);
      ctx.stroke();
    }
    
    ctx.fillStyle = allianceColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = "#2e2e43";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    const eyeRadius = 2;
    const eyeOffset = 3;
    ctx.fillStyle = "#c06852";
    ctx.beginPath();
    ctx.arc(-eyeOffset, -eyeOffset * 0.5, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeOffset, -eyeOffset * 0.5, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
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
