import { TankManager } from "./TankManager";
import { ProjectileManager } from "./ProjectileManager";
import { TerrainManager } from "./TerrainManager";
import { ScoreManager } from "./ScoreManager";
import { GunInventoryManager } from "./GunInventoryManager";
import { PickupManager } from "./PickupManager";

export const UNIT_TO_PIXEL = 50;

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
  private gunInventoryManager: GunInventoryManager;
  private pickupManager: PickupManager;

  constructor(canvas: HTMLCanvasElement, worldId: string) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.tankManager = new TankManager(worldId);
    this.terrainManager = new TerrainManager(worldId);
    this.projectileManager = new ProjectileManager(worldId);
    this.scoreManager = new ScoreManager(worldId);
    this.gunInventoryManager = new GunInventoryManager(worldId);
    this.pickupManager = new PickupManager(worldId);
  }

  private resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
  }

  private numberToChessNotation(num: number): string {
    let result = '';
    let n = num + 1;
    
    while (n > 0) {
      n--;
      result = String.fromCharCode(97 + (n % 26)) + result;
      n = Math.floor(n / 26);
    }
    
    return result.toUpperCase();
  }

  private drawCoordinateLabels(cameraX: number, cameraY: number) {
    const worldWidth = this.terrainManager.getWorldWidth();
    const worldHeight = this.terrainManager.getWorldHeight();

    if (worldWidth === 0 || worldHeight === 0) return;

    this.ctx.save();
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "12px 'JetBrains Mono', monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const startX = Math.floor(cameraX / UNIT_TO_PIXEL);
    const endX = Math.ceil((cameraX + this.canvas.width) / UNIT_TO_PIXEL);
    const startY = Math.floor(cameraY / UNIT_TO_PIXEL);
    const endY = Math.ceil((cameraY + this.canvas.height) / UNIT_TO_PIXEL);

    for (let x = Math.max(0, startX); x <= Math.min(worldWidth - 1, endX); x++) {
      const screenX = x * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2 - cameraX;
      
      if (screenX >= 0 && screenX <= this.canvas.width) {
        this.ctx.fillText(x.toString(), screenX, 10);
        this.ctx.fillText(x.toString(), screenX, this.canvas.height - 10);
      }
    }

    this.ctx.textAlign = "left";
    for (let y = Math.max(0, startY); y <= Math.min(worldHeight - 1, endY); y++) {
      const screenY = y * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2 - cameraY;
      
      if (screenY >= 0 && screenY <= this.canvas.height) {
        const label = this.numberToChessNotation(y);
        this.ctx.fillText(label, 5, screenY);
        this.ctx.textAlign = "right";
        this.ctx.fillText(label, this.canvas.width - 5, screenY);
        this.ctx.textAlign = "left";
      }
    }

    this.ctx.restore();
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

    this.pickupManager.draw(
      this.ctx,
      cameraX,
      cameraY,
      this.canvas.width,
      this.canvas.height
    );

    for (const tank of this.tankManager.getAllTanks()) {
      tank.draw(this.ctx);
    }

    for (const projectile of this.projectileManager.getAllProjectiles()) {
      projectile.draw(this.ctx);
    }

    this.ctx.restore();

    this.drawCoordinateLabels(cameraX, cameraY);

    this.scoreManager.draw(this.ctx, this.canvas.width);
    this.gunInventoryManager.draw(this.ctx, this.canvas.width, this.canvas.height);

    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
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
