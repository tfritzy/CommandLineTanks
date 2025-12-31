import { TankManager } from "./managers/TankManager";
import { ProjectileManager } from "./managers/ProjectileManager";
import { TerrainManager } from "./managers/TerrainManager";
import { ScoreManager } from "./managers/ScoreManager";
import { GunInventoryManager } from "./managers/GunInventoryManager";
import { PickupManager } from "./managers/PickupManager";
import { MiniMapManager } from "./managers/MiniMapManager";
import { KillManager } from "./managers/KillManager";
import { SmokeCloudManager } from "./managers/SmokeCloudManager";
import { AbilitiesBarManager } from "./managers/AbilitiesBarManager";
import { UNIT_TO_PIXEL } from "./constants";
import { ScreenShake } from "./utils/ScreenShake";

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
  private smokeCloudManager: SmokeCloudManager;
  private abilitiesBarManager: AbilitiesBarManager;
  private currentCameraX: number = 0;
  private currentCameraY: number = 0;
  private screenShake: ScreenShake;
  private resizeHandler: () => void;
  private fps: number = 0;
  private fpsFrameCount: number = 0;
  private fpsLastUpdate: number = 0;

  constructor(canvas: HTMLCanvasElement, worldId: string) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;

    this.resizeHandler = () => this.resizeCanvas();
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeHandler);

    this.screenShake = new ScreenShake();
    this.tankManager = new TankManager(worldId, this.screenShake);
    this.terrainManager = new TerrainManager(worldId);
    this.projectileManager = new ProjectileManager(worldId, this.screenShake);
    this.projectileManager.setTankManager(this.tankManager);
    this.scoreManager = new ScoreManager(worldId);
    this.gunInventoryManager = new GunInventoryManager(worldId);
    this.pickupManager = new PickupManager(worldId);
    this.miniMapManager = new MiniMapManager(
      this.tankManager,
      worldId
    );
    this.killManager = new KillManager(worldId);
    this.smokeCloudManager = new SmokeCloudManager(worldId);
    this.abilitiesBarManager = new AbilitiesBarManager(worldId);
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
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }
  }

  private drawRelativeDistanceLabels(cameraX: number, cameraY: number) {
    const playerTank = this.tankManager.getPlayerTank();
    if (!playerTank) return;

    const worldWidth = this.terrainManager.getWorldWidth();
    const worldHeight = this.terrainManager.getWorldHeight();
    if (worldWidth === 0 || worldHeight === 0) return;

    const displayWidth = this.canvas.width;
    const displayHeight = this.canvas.height;

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

    for (
      let x = Math.max(0, startX);
      x <= Math.min(worldWidth - 1, endX);
      x++
    ) {
      const relativeX = x - playerGridX;

      if (relativeX % LABEL_INTERVAL === 0 && relativeX !== 0) {
        const worldX = x * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2;
        const worldY = playerGridY * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2;
        const label = relativeX > 0 ? `+${relativeX}` : relativeX.toString();
        this.ctx.fillText(label, worldX, worldY);
      }
    }

    for (
      let y = Math.max(0, startY);
      y <= Math.min(worldHeight - 1, endY);
      y++
    ) {
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

    this.fpsFrameCount++;
    if (currentTime - this.fpsLastUpdate >= 1000) {
      this.fps = Math.round((this.fpsFrameCount * 1000) / (currentTime - this.fpsLastUpdate));
      this.fpsFrameCount = 0;
      this.fpsLastUpdate = currentTime;
    }

    this.tankManager.update(deltaTime);
    this.projectileManager.update(deltaTime);
    this.terrainManager.update(deltaTime);
    this.killManager.update(deltaTime);
    this.smokeCloudManager.update(deltaTime);

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.width / dpr;
    const displayHeight = this.canvas.height / dpr;

    this.ctx.clearRect(0, 0, displayWidth, displayHeight);

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
    
    this.currentCameraX = Math.round(this.currentCameraX);
    this.currentCameraY = Math.round(this.currentCameraY);

    const shakeOffset = this.screenShake.update(deltaTime);
    const finalCameraX = this.currentCameraX + shakeOffset.x;
    const finalCameraY = this.currentCameraY + shakeOffset.y;

    this.ctx.translate(-finalCameraX, -finalCameraY);

    this.terrainManager.draw(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
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
    this.tankManager.drawParticles(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );

    this.terrainManager.drawShadows(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );

    this.terrainManager.drawBodies(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );
    this.tankManager.drawNameLabels(this.ctx);
    this.tankManager.drawHealthBars(this.ctx);
    this.tankManager.drawTankIndicators(this.ctx);

    this.terrainManager.drawParticles(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );

    this.smokeCloudManager.draw(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );

    this.projectileManager.drawShadows(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );
    this.projectileManager.drawBodies(
      this.ctx,
      this.currentCameraX,
      this.currentCameraY,
      displayWidth,
      displayHeight
    );

    // this.collisionVisualizationManager.draw(
    //   this.ctx,
    //   cameraX,
    //   cameraY,
    //   displayWidth,
    //   displayHeight
    // );

    this.ctx.restore();

    this.scoreManager.draw(this.ctx, displayWidth);
    this.miniMapManager.draw(this.ctx, displayWidth, displayHeight);
    this.gunInventoryManager.draw(this.ctx, displayWidth, displayHeight);
    this.abilitiesBarManager.draw(this.ctx, displayWidth, displayHeight);
    this.killManager.draw(this.ctx, displayWidth);

    if (this.fps > 0) {
      this.ctx.save();
      this.ctx.font = "14px monospace";
      this.ctx.fillStyle = "#fcfbf3";
      this.ctx.strokeStyle = "#2e2e43";
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(`FPS: ${this.fps}`, 10, 20);
      this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
      this.ctx.restore();
    }

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
    
    this.tankManager.destroy();
    this.projectileManager.destroy();
    this.terrainManager.destroy();
    this.scoreManager.destroy();
    this.gunInventoryManager.destroy();
    this.pickupManager.destroy();
    this.miniMapManager.destroy();
    this.killManager.destroy();
    this.smokeCloudManager.destroy();
    this.abilitiesBarManager.destroy();
    
    window.removeEventListener("resize", this.resizeHandler);
  }
}
