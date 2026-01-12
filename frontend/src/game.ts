import { TankManager } from "./managers/TankManager";
import { SoundManager } from "./managers/SoundManager";
import { ProjectileManager } from "./managers/ProjectileManager";
import { TerrainManager } from "./managers/TerrainManager";
import { GunInventoryManager } from "./managers/GunInventoryManager";
import { PickupManager } from "./managers/PickupManager";
import { MiniMapManager } from "./managers/MiniMapManager";
import { KillManager } from "./managers/KillManager";
import { COLORS, UNIT_TO_PIXEL } from "./constants";
import { ScreenShake } from "./utils/ScreenShake";
import { FpsCounter } from "./utils/FpsCounter";
import { Profiler } from "./utils/Profiler";
import { initializeAllTextures } from "./textures";

const CAMERA_FOLLOW_SPEED = 15;
const CAMERA_TELEPORT_THRESHOLD = 50;

let texturesInitialized = false;
let textureInitPromise: Promise<void> | null = null;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private time: number = 0;
  private lastFrameTime: number = 0;
  private tankManager: TankManager;
  private soundManager: SoundManager;
  private projectileManager: ProjectileManager;
  private terrainManager: TerrainManager;
  private gunInventoryManager: GunInventoryManager;
  private pickupManager: PickupManager;
  private miniMapManager: MiniMapManager;
  private killManager: KillManager;
  private currentCameraX: number = 0;
  private currentCameraY: number = 0;
  private screenShake: ScreenShake;
  private resizeHandler: () => void;
  private resizeObserver: ResizeObserver | null = null;
  private fpsCounter: FpsCounter;
  private profiler: Profiler;

  private texturesReady: boolean = false;

  constructor(canvas: HTMLCanvasElement, gameId: string) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;

    this.resizeHandler = () => this.resizeCanvas();
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeHandler);

    if (this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas();
      });
      this.resizeObserver.observe(this.canvas.parentElement);
    }

    this.soundManager = SoundManager.getInstance();
    this.screenShake = new ScreenShake();
    this.fpsCounter = new FpsCounter();
    this.profiler = new Profiler();
    this.tankManager = new TankManager(
      gameId,
      this.screenShake,
      this.soundManager
    );
    this.terrainManager = new TerrainManager(gameId, this.soundManager);
    this.projectileManager = new ProjectileManager(
      gameId,
      this.screenShake,
      this.soundManager
    );
    this.projectileManager.setTankManager(this.tankManager);
    this.gunInventoryManager = new GunInventoryManager(gameId);
    this.pickupManager = new PickupManager(gameId, this.soundManager);
    this.miniMapManager = new MiniMapManager(this.tankManager, gameId);
    this.killManager = new KillManager(gameId, this.soundManager);
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
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  private update(currentTime: number = 0) {
    const deltaTime =
      this.lastFrameTime === 0 ? 0 : (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    this.time += deltaTime;

    this.fpsCounter.update(currentTime);

    this.tankManager.update(deltaTime);
    this.projectileManager.update(deltaTime);
    this.terrainManager.update(deltaTime);
    this.killManager.update(deltaTime);

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.width / dpr;
    const displayHeight = this.canvas.height / dpr;

    this.ctx.clearRect(0, 0, displayWidth, displayHeight);
    this.ctx.fillStyle = COLORS.TERRAIN.GROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    const playerTank = this.tankManager.getPlayerTank();
    let targetCameraX = this.currentCameraX;
    let targetCameraY = this.currentCameraY;

    if (playerTank) {
      const playerPos = playerTank.getPosition();
      targetCameraX = playerPos.x * UNIT_TO_PIXEL - displayWidth / 2;
      targetCameraY = playerPos.y * UNIT_TO_PIXEL - displayHeight / 2;
      this.pickupManager.setPlayerAlliance(playerTank.getAlliance());
    } else {
      this.pickupManager.setPlayerAlliance(null);
    }

    this.currentCameraX = targetCameraX;
    this.currentCameraY = targetCameraY;

    this.currentCameraX = Math.floor(this.currentCameraX);
    this.currentCameraY = Math.floor(this.currentCameraY);

    const shakeOffset = this.screenShake.update(deltaTime);
    const finalCameraX = this.currentCameraX + shakeOffset.x;
    const finalCameraY = this.currentCameraY + shakeOffset.y;

    this.ctx.translate(-finalCameraX, -finalCameraY);

    const centerX = this.currentCameraX + displayWidth / 2;
    const centerY = this.currentCameraY + displayHeight / 2;
    const listenerX = centerX / UNIT_TO_PIXEL;
    const listenerY = centerY / UNIT_TO_PIXEL;
    this.soundManager.setListenerPosition(listenerX, listenerY);

    this.profiler.profile("terrain_draw", () =>
      this.terrainManager.draw(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );

    this.profiler.profile("terrain_decorations", () =>
      this.terrainManager.drawDecorations(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );

    this.profiler.profile("pickup_draw", () =>
      this.pickupManager.draw(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );

    this.profiler.profile("tank_paths", () =>
      this.tankManager.drawPaths(this.ctx)
    );
    this.profiler.profile("tank_shadows", () =>
      this.tankManager.drawShadows(this.ctx)
    );
    this.profiler.profile("tank_bodies", () =>
      this.tankManager.drawBodies(this.ctx)
    );

    this.profiler.profile("tank_particles", () =>
      this.tankManager.drawParticles(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );

    this.profiler.profile("terrain_shadows", () =>
      this.terrainManager.drawShadows(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );

    this.profiler.profile("terrain_bodies", () =>
      this.terrainManager.drawBodies(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );
    this.profiler.profile("tank_labels", () =>
      this.tankManager.drawNameLabels(this.ctx)
    );
    this.profiler.profile("tank_health", () =>
      this.tankManager.drawHealthBars(this.ctx)
    );
    this.profiler.profile("tank_indicators", () =>
      this.tankManager.drawTankIndicators(this.ctx)
    );

    this.profiler.profile("terrain_particles", () =>
      this.terrainManager.drawParticles(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );

    this.profiler.profile("projectile_shadows", () =>
      this.projectileManager.drawShadows(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );
    this.profiler.profile("projectile_bodies", () =>
      this.projectileManager.drawBodies(
        this.ctx,
        this.currentCameraX,
        this.currentCameraY,
        displayWidth,
        displayHeight
      )
    );

    this.ctx.restore();

    this.profiler.profile("minimap", () =>
      this.miniMapManager.draw(this.ctx, displayWidth, displayHeight)
    );
    this.profiler.profile("gun_inventory", () =>
      this.gunInventoryManager.draw(this.ctx, displayWidth, displayHeight)
    );
    this.profiler.profile("kill_manager", () =>
      this.killManager.draw(this.ctx, displayWidth)
    );

    this.fpsCounter.draw(this.ctx, displayHeight);

    this.profiler.update();

    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
  }

  public start() {
    if (this.animationFrameId) return;

    this.lastFrameTime = 0;

    if (texturesInitialized) {
      this.texturesReady = true;
      this.update();
      return;
    }

    if (!textureInitPromise) {
      textureInitPromise = initializeAllTextures().then(() => {
        texturesInitialized = true;
      });
    }

    textureInitPromise.then(() => {
      if (this.texturesReady) return;
      this.texturesReady = true;
      if (!this.animationFrameId) {
        this.update();
      }
    });
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
    this.gunInventoryManager.destroy();
    this.pickupManager.destroy();
    this.miniMapManager.destroy();
    this.killManager.destroy();

    window.removeEventListener("resize", this.resizeHandler);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
}
