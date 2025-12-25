import { TankManager } from "./managers/TankManager";
import { ProjectileManager } from "./managers/ProjectileManager";
import { TerrainManager } from "./managers/TerrainManager";
import { ScoreManager } from "./managers/ScoreManager";
import { GunInventoryManager } from "./managers/GunInventoryManager";
import { PickupManager } from "./managers/PickupManager";
import { MiniMapManager } from "./managers/MiniMapManager";
import { KillManager } from "./managers/KillManager";
import { SpiderMineManager } from "./managers/SpiderMineManager";

export const UNIT_TO_PIXEL = 50;
const CAMERA_FOLLOW_SPEED = 15;

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
  private miniMapManager: MiniMapManager;
  private killManager: KillManager;
  private spiderMineManager: SpiderMineManager;
  private currentCameraX: number = 0;
  private currentCameraY: number = 0;

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
    this.miniMapManager = new MiniMapManager(this.tankManager, this.terrainManager);
    this.killManager = new KillManager(worldId);
    this.spiderMineManager = new SpiderMineManager(worldId);
  }

  private resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = parent.clientWidth;
      const displayHeight = parent.clientHeight;

      this.canvas.width = displayWidth * dpr;
      this.canvas.height = displayHeight * dpr;

      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;

      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private drawRelativeDistanceLabels(cameraX: number, cameraY: number) {
    const playerTank = this.tankManager.getPlayerTank();
    if (!playerTank) return;

    const worldWidth = this.terrainManager.getWorldWidth();
    const worldHeight = this.terrainManager.getWorldHeight();
    if (worldWidth === 0 || worldHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.width / dpr;
    const displayHeight = this.canvas.height / dpr;

    const playerPos = playerTank.getPosition();
    const playerGridX = Math.floor(playerPos.x);
    const playerGridY = Math.floor(playerPos.y);
    const LABEL_INTERVAL = 5;

    const startX = Math.floor(cameraX / UNIT_TO_PIXEL);
    const endX = Math.ceil((cameraX + displayWidth) / UNIT_TO_PIXEL);
    const startY = Math.floor(cameraY / UNIT_TO_PIXEL);
    const endY = Math.ceil((cameraY + displayHeight) / UNIT_TO_PIXEL);

    this.ctx.save();
    this.ctx.fillStyle = "#6a6b7b";
    this.ctx.font = "10px 'JetBrains Mono', monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    for (let x = Math.max(0, startX); x <= Math.min(worldWidth - 1, endX); x++) {
      const relativeX = x - playerGridX;

      if (relativeX % LABEL_INTERVAL === 0 && relativeX !== 0) {
        const worldX = x * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2;
        const worldY = playerGridY * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2;
        const label = relativeX > 0 ? `+${relativeX}` : relativeX.toString();
        this.ctx.fillText(label, worldX, worldY);
      }
    }

    for (let y = Math.max(0, startY); y <= Math.min(worldHeight - 1, endY); y++) {
      const relativeY = playerGridY - y;

      if (relativeY % LABEL_INTERVAL === 0 && relativeY !== 0) {
        const worldX = playerGridX * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2;
        const worldY = y * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2;
        const label = relativeY > 0 ? `+${relativeY}` : relativeY.toString();
        this.ctx.fillText(label, worldX, worldY);
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
    this.terrainManager.update(deltaTime);
    this.killManager.update(deltaTime);
    this.spiderMineManager.update(deltaTime);

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.width / dpr;
    const displayHeight = this.canvas.height / dpr;

    this.ctx.fillStyle = "#2e2e43";
    this.ctx.fillRect(0, 0, displayWidth, displayHeight);

    this.ctx.save();

    const playerTank = this.tankManager.getPlayerTank();
    let targetCameraX = this.currentCameraX;
    let targetCameraY = this.currentCameraY;

    if (playerTank) {
      const playerPos = playerTank.getPosition();
      targetCameraX = playerPos.x * UNIT_TO_PIXEL - displayWidth / 2;
      targetCameraY = playerPos.y * UNIT_TO_PIXEL - displayHeight / 2;
    }

    const clampedDeltaTime = Math.min(deltaTime, 1 / 30);
    const lerpFactor = Math.min(1, clampedDeltaTime * CAMERA_FOLLOW_SPEED);
    this.currentCameraX += (targetCameraX - this.currentCameraX) * lerpFactor;
    this.currentCameraY += (targetCameraY - this.currentCameraY) * lerpFactor;

    this.ctx.translate(-this.currentCameraX, -this.currentCameraY);

    this.terrainManager.draw(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight,
      UNIT_TO_PIXEL
    );

    this.pickupManager.draw(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );

    this.tankManager.drawPaths(this.ctx);
    this.tankManager.drawShadows(this.ctx);

    this.drawRelativeDistanceLabels(this.currentCameraX, this.currentCameraY);


    this.tankManager.drawBodies(this.ctx);
    this.tankManager.drawParticles(this.ctx, this.currentCameraX, this.currentCameraY, displayWidth, displayHeight);

    this.spiderMineManager.draw(this.ctx);

    this.terrainManager.drawShadows(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight,
      UNIT_TO_PIXEL
    );

    this.terrainManager.drawBodies(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight,
      UNIT_TO_PIXEL
    );
    this.tankManager.drawHealthBars(this.ctx);
    this.tankManager.drawTankIndicators(this.ctx);

    this.terrainManager.drawParticles(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );

    this.projectileManager.drawShadows(this.ctx, this.currentCameraX, this.currentCameraY, displayWidth, displayHeight);
    this.projectileManager.drawBodies(this.ctx, this.currentCameraX, this.currentCameraY, displayWidth, displayHeight);

    // this.collisionVisualizationManager.draw(
    //   this.ctx,
    //   cameraX,
    //   cameraY,
    //   displayWidth,
    //   displayHeight,
    //   UNIT_TO_PIXEL
    // );

    this.ctx.restore();

    this.scoreManager.draw(this.ctx, displayWidth);
    this.miniMapManager.draw(this.ctx, displayWidth, displayHeight);
    this.gunInventoryManager.draw(this.ctx, displayWidth, displayHeight);
    this.killManager.draw(this.ctx, displayWidth, displayHeight);

    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
  }

  public start() {
    if (!this.animationFrameId) {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = this.canvas.width / dpr;
      const displayHeight = this.canvas.height / dpr;

      const playerTank = this.tankManager.getPlayerTank();
      if (playerTank) {
        const playerPos = playerTank.getPosition();
        this.currentCameraX = playerPos.x * UNIT_TO_PIXEL - displayWidth / 2;
        this.currentCameraY = playerPos.y * UNIT_TO_PIXEL - displayHeight / 2;
      }

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
