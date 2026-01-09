export { SvgTextureSheet, svgToImage, svgToImageAsync } from "./svg-cache";
export { ProjectileSvgSheet, getProjectileSvgSheet, initProjectileSvgSheet } from "./projectiles";
export { TerrainDetailSvgSheet, getTerrainDetailSvgSheet, initTerrainDetailSvgSheet } from "./terrain-details";
export { PickupSvgSheet, getRedTeamPickupSvgSheet, getBlueTeamPickupSvgSheet, initPickupSvgSheets } from "./pickups";

import { initProjectileSvgSheet } from "./projectiles";
import { initTerrainDetailSvgSheet } from "./terrain-details";
import { initPickupSvgSheets } from "./pickups";

export async function initAllSvgSheets(): Promise<void> {
  await Promise.all([
    initProjectileSvgSheet(),
    initTerrainDetailSvgSheet(),
    initPickupSvgSheets()
  ]);
}
