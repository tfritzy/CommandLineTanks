import { TankManager } from "./TankManager";
import { TerrainManager } from "./TerrainManager";

export class MiniMapManager {
  private tankManager: TankManager;
  private terrainManager: TerrainManager;
  private miniMapSize: number = 150;
  private margin: number = 20;

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

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(miniMapX - 5, miniMapY - 5, this.miniMapSize + 10, this.miniMapSize + 10);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(miniMapX, miniMapY, this.miniMapSize, this.miniMapSize);

    const playerPos = playerTank.getPosition();
    const tankX = (playerPos.x / worldWidth) * this.miniMapSize;
    const tankY = (playerPos.y / worldHeight) * this.miniMapSize;

    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.arc(
      miniMapX + tankX,
      miniMapY + tankY,
      5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }
}
