import { type Infer } from "spacetimedb";
import BaseTerrain from "../../module_bindings/base_terrain_type";
import { getTileCaseFromCorners } from "../constants/lake-tile-cases";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export function getRenderTileCase(
  baseTerrainLayer: BaseTerrainType[],
  worldWidth: number,
  worldHeight: number,
  renderX: number,
  renderY: number
): number {
  const tl = isLake(baseTerrainLayer, worldWidth, worldHeight, renderX, renderY);
  const tr = isLake(baseTerrainLayer, worldWidth, worldHeight, renderX + 1, renderY);
  const bl = isLake(baseTerrainLayer, worldWidth, worldHeight, renderX, renderY + 1);
  const br = isLake(baseTerrainLayer, worldWidth, worldHeight, renderX + 1, renderY + 1);
  
  return getTileCaseFromCorners(tl, tr, bl, br);
}

function isLake(
  baseTerrainLayer: BaseTerrainType[],
  worldWidth: number,
  worldHeight: number,
  x: number,
  y: number
): boolean {
  if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
    return false;
  }
  
  const index = y * worldWidth + x;
  return baseTerrainLayer[index]?.tag === "Lake";
}
