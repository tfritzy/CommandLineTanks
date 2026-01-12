import { type Infer } from "spacetimedb";
import { BaseTerrain } from "../../../module_bindings";
import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";
import { waterTextureCache } from "../../textures";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export function drawBaseTerrain(
  ctx: CanvasRenderingContext2D,
  baseTerrainLayer: BaseTerrainType[],
  worldWidth: number,
  worldHeight: number,
  startTileX: number,
  endTileX: number,
  startTileY: number,
  endTileY: number
) {
  ctx.beginPath();
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      if (
        tileX < 0 ||
        tileX >= worldWidth ||
        tileY < 0 ||
        tileY >= worldHeight
      ) {
        continue;
      }

      const index = tileY * worldWidth + tileX;
      const terrain = baseTerrainLayer[index];

      if (terrain.tag === "BlackChecker") {
        const worldX = tileX * UNIT_TO_PIXEL;
        const worldY = tileY * UNIT_TO_PIXEL;
        ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
      }
    }
  }
  ctx.fillStyle = COLORS.TERRAIN.BLACK_CHECKER;
  ctx.fill();

  ctx.beginPath();
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      if (
        tileX < 0 ||
        tileX >= worldWidth ||
        tileY < 0 ||
        tileY >= worldHeight
      ) {
        continue;
      }

      const index = tileY * worldWidth + tileX;
      const terrain = baseTerrainLayer[index];

      if (terrain.tag === "WhiteChecker") {
        const worldX = tileX * UNIT_TO_PIXEL;
        const worldY = tileY * UNIT_TO_PIXEL;
        ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
      }
    }
  }
  ctx.fillStyle = COLORS.TERRAIN.WHITE_CHECKER;
  ctx.fill();

  const numGrooves = 2;
  const grooveHeight = UNIT_TO_PIXEL * 0.15;
  ctx.fillStyle = COLORS.TERRAIN.FARM_GROOVE;
  ctx.beginPath();
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      if (
        tileX < 0 ||
        tileX >= worldWidth ||
        tileY < 0 ||
        tileY >= worldHeight
      ) {
        continue;
      }

      const index = tileY * worldWidth + tileX;
      const terrain = baseTerrainLayer[index];

      if (terrain.tag === "Farm") {
        const worldX = tileX * UNIT_TO_PIXEL;
        const worldY = tileY * UNIT_TO_PIXEL;

        for (let i = 0; i < numGrooves; i++) {
          const grooveY =
            worldY +
            UNIT_TO_PIXEL * ((i + 0.5) / numGrooves) -
            grooveHeight / 2;
          ctx.rect(worldX, grooveY, UNIT_TO_PIXEL, grooveHeight);
        }
      }
    }
  }
  ctx.fill();

  ctx.fillStyle = COLORS.TERRAIN.CHECKER;
  ctx.beginPath();
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      if (
        tileX < 0 ||
        tileX >= worldWidth ||
        tileY < 0 ||
        tileY >= worldHeight
      ) {
        continue;
      }

      if ((tileX + tileY) % 2 === 0) {
        const worldX = tileX * UNIT_TO_PIXEL;
        const worldY = tileY * UNIT_TO_PIXEL;
        ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
      }
    }
  }
  ctx.fill();

  ctx.strokeStyle = COLORS.TERRAIN.GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  
  const topY = Math.max(startTileY, 0) * UNIT_TO_PIXEL;
  const bottomY = Math.min(endTileY + 1, worldHeight) * UNIT_TO_PIXEL;
  for (let tileX = startTileX; tileX <= endTileX; tileX++) {
    if (tileX < 0 || tileX >= worldWidth) {
      continue;
    }
    const worldX = tileX * UNIT_TO_PIXEL;
    ctx.moveTo(worldX, topY);
    ctx.lineTo(worldX, bottomY);
  }
  if (endTileX + 1 <= worldWidth) {
    const worldX = (endTileX + 1) * UNIT_TO_PIXEL;
    ctx.moveTo(worldX, topY);
    ctx.lineTo(worldX, bottomY);
  }
  
  const leftX = Math.max(startTileX, 0) * UNIT_TO_PIXEL;
  const rightX = Math.min(endTileX + 1, worldWidth) * UNIT_TO_PIXEL;
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    if (tileY < 0 || tileY >= worldHeight) {
      continue;
    }
    const worldY = tileY * UNIT_TO_PIXEL;
    ctx.moveTo(leftX, worldY);
    ctx.lineTo(rightX, worldY);
  }
  if (endTileY + 1 <= worldHeight) {
    const worldY = (endTileY + 1) * UNIT_TO_PIXEL;
    ctx.moveTo(leftX, worldY);
    ctx.lineTo(rightX, worldY);
  }
  ctx.stroke();

  drawWaterDualGrid(
    ctx,
    baseTerrainLayer,
    worldWidth,
    worldHeight,
    startTileX,
    endTileX,
    startTileY,
    endTileY
  );
}

function drawWaterDualGrid(
  ctx: CanvasRenderingContext2D,
  baseTerrainLayer: BaseTerrainType[],
  worldWidth: number,
  worldHeight: number,
  startTileX: number,
  endTileX: number,
  startTileY: number,
  endTileY: number
) {
  const halfTile = UNIT_TO_PIXEL / 2;
  const dualStartX = startTileX - 1;
  const dualEndX = endTileX;
  const dualStartY = startTileY - 1;
  const dualEndY = endTileY;

  for (let dualY = dualStartY; dualY <= dualEndY; dualY++) {
    for (let dualX = dualStartX; dualX <= dualEndX; dualX++) {
      const tileIndex = waterTextureCache.computeTileIndex(
        baseTerrainLayer,
        worldWidth,
        worldHeight,
        dualX,
        dualY
      );

      if (tileIndex === 0) continue;

      const screenX = dualX * UNIT_TO_PIXEL + halfTile;
      const screenY = dualY * UNIT_TO_PIXEL + halfTile;

      waterTextureCache.draw(ctx, tileIndex, screenX, screenY);
    }
  }
}
