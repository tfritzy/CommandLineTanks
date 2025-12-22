import { TankManager } from "./TankManager";
import { TerrainManager } from "./TerrainManager";

export class MiniMapManager {
  private tankManager: TankManager;
  private terrainManager: TerrainManager;
  private miniMapMaxSize: number = 150;
  private margin: number = 20;
  private tankIndicatorRadius: number = 5;

  constructor(tankManager: TankManager, terrainManager: TerrainManager) {
    this.tankManager = tankManager;
    this.terrainManager = terrainManager;
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    const worldWidth = this.terrainManager.getWorldWidth();
    const worldHeight = this.terrainManager.getWorldHeight();
    
    if (worldWidth === 0 || worldHeight === 0) return;

    const playerTank = this.tankManager.getPlayerTank();
    if (!playerTank) return;

    const aspectRatio = worldWidth / worldHeight;
    let miniMapWidth: number;
    let miniMapHeight: number;
    
    if (aspectRatio > 1) {
      miniMapWidth = this.miniMapMaxSize;
      miniMapHeight = this.miniMapMaxSize / aspectRatio;
    } else {
      miniMapHeight = this.miniMapMaxSize;
      miniMapWidth = this.miniMapMaxSize * aspectRatio;
    }

    const miniMapX = canvasWidth - miniMapWidth - this.margin;
    const miniMapY = canvasHeight - miniMapHeight - this.margin;

    ctx.save();

    ctx.fillStyle = "#2e2e43";
    ctx.fillRect(
      miniMapX,
      miniMapY,
      miniMapWidth,
      miniMapHeight
    );

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);

    const playerPos = playerTank.getPosition();
    const clampedX = Math.max(0, Math.min(playerPos.x, worldWidth));
    const clampedY = Math.max(0, Math.min(playerPos.y, worldHeight));
    const tankX = (clampedX / worldWidth) * miniMapWidth;
    const tankY = (clampedY / worldHeight) * miniMapHeight;

    const tankColor = playerTank.getAllianceColor();
    ctx.fillStyle = tankColor;
    ctx.beginPath();
    ctx.arc(
      miniMapX + tankX,
      miniMapY + tankY,
      this.tankIndicatorRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }
}
