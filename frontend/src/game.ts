import { TankManager } from "./TankManager";
import { ProjectileManager } from "./ProjectileManager";
import { TerrainManager } from "./TerrainManager";
import { ScoreManager } from "./ScoreManager";

export const UNIT_TO_PIXEL = 50;
const MAX_SCORE = 100;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private time: number = 0;
  private lastFrameTime: number = 0;
  private tankManager: TankManager;
  private projectileManager: ProjectileManager;
  private terrainManager: TerrainManager;
  private scoreManager: ScoreManager;

  constructor(canvas: HTMLCanvasElement, worldId: string) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.tankManager = new TankManager();
    this.terrainManager = new TerrainManager(worldId);
    this.projectileManager = new ProjectileManager(worldId);
    this.scoreManager = new ScoreManager(worldId);
  }

  private resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
  }

  private update(currentTime: number = 0) {
    const deltaTime =
      this.lastFrameTime === 0 ? 0 : (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    this.time += deltaTime;

    this.tankManager.update(deltaTime);
    this.projectileManager.update(deltaTime);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(0, this.canvas.height);
    this.ctx.scale(1, -1);

    const playerTank = this.tankManager.getPlayerTank();
    let cameraX = 0;
    let cameraY = 0;
    
    if (playerTank) {
      const playerPos = playerTank.getPosition();
      cameraX = playerPos.x * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2 - this.canvas.width / 2;
      cameraY = playerPos.y * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2 - this.canvas.height / 2;
    }

    this.ctx.translate(-cameraX, -cameraY);

    this.terrainManager.draw(
      this.ctx,
      cameraX,
      cameraY,
      this.canvas.width,
      this.canvas.height,
      UNIT_TO_PIXEL
    );

    for (const tank of this.tankManager.getAllTanks()) {
      tank.draw(this.ctx);
    }

    for (const projectile of this.projectileManager.getAllProjectiles()) {
      projectile.draw(this.ctx);
    }

    this.ctx.restore();

    this.drawScores();

    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
  }

  private drawScores() {
    const scores = this.scoreManager.getScores();
    
    this.ctx.save();
    
    const padding = 20;
    const barWidth = 200;
    const barHeight = 20;
    const spacing = 10;
    const x = this.canvas.width - padding;
    
    let y = padding + 20;
    y = this.drawTeamScore('Team Red', scores[0] || 0, '#ff6666', x, y, barWidth, barHeight, spacing);
    
    y += spacing + 20;
    this.drawTeamScore('Team Blue', scores[1] || 0, '#6666ff', x, y, barWidth, barHeight, spacing);
    
    this.ctx.restore();
  }

  private drawTeamScore(
    teamName: string,
    score: number,
    color: string,
    x: number,
    y: number,
    barWidth: number,
    barHeight: number,
    spacing: number
  ): number {
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = color;
    this.ctx.fillText(`${teamName}: ${score}/${MAX_SCORE}`, x, y);
    
    y += spacing;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - barWidth, y, barWidth, barHeight);
    
    const progress = Math.min(score / MAX_SCORE, 1);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x - barWidth, y, barWidth * progress, barHeight);
    
    return y + barHeight;
  }

  public start() {
    if (!this.animationFrameId) {
      this.lastFrameTime = 0;
      this.update();
    }
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener("resize", () => this.resizeCanvas());
  }
}
