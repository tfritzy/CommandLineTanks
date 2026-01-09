import { type Infer } from "spacetimedb";
import { BaseTerrain } from "../../../module_bindings";
import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";

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

      if (terrain.tag !== "BlackChecker" && terrain.tag !== "WhiteChecker") {
        const worldX = tileX * UNIT_TO_PIXEL;
        const worldY = tileY * UNIT_TO_PIXEL;
        ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
      }
    }
  }
  ctx.fillStyle = COLORS.TERRAIN.GROUND;
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

  ctx.fillStyle = COLORS.TERRAIN.FARM_GROOVE;
  const numGrooves = 2;
  const grooveHeight = UNIT_TO_PIXEL * 0.15;
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

      const worldX = tileX * UNIT_TO_PIXEL;
      const worldY = tileY * UNIT_TO_PIXEL;
      ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
    }
  }
  ctx.stroke();
}
