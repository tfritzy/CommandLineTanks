import { TankManager } from "./TankManager";
import { TerrainManager } from "./TerrainManager";

export class MiniMapManager {
  private tankManager: TankManager;
  private terrainManager: TerrainManager;
  private miniMapSize: number = 150;
  private margin: number = 20;
  private backgroundPadding: number = 5;
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

    const miniMapX = canvasWidth - this.miniMapSize - this.margin;
    const miniMapY = canvasHeight - this.miniMapSize - this.margin;

    ctx.save();

    ctx.fillStyle = "#2e2e43";
    ctx.fillRect(
      miniMapX - this.backgroundPadding,
      miniMapY - this.backgroundPadding,
      this.miniMapSize + this.backgroundPadding * 2,
      this.miniMapSize + this.backgroundPadding * 2
    );

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(miniMapX, miniMapY, this.miniMapSize, this.miniMapSize);

    const playerPos = playerTank.getPosition();
    const tankX = Math.max(0, Math.min((playerPos.x / worldWidth) * this.miniMapSize, this.miniMapSize));
    const tankY = Math.max(0, Math.min((playerPos.y / worldHeight) * this.miniMapSize, this.miniMapSize));

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
