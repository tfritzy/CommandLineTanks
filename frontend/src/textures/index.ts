export { projectileTextureCache } from "./ProjectileTextureCache";
export { redTeamPickupTextureCache, blueTeamPickupTextureCache, initializePickupTextures } from "./PickupTextureCache";
export { terrainDetailTextureCache } from "./TerrainDetailTextureCache";
export { waterTextureCache } from "./WaterTextureCache";
export { renderToImageBitmap, drawTexture, type TextureImage } from "./TextureRenderer";

import { projectileTextureCache } from "./ProjectileTextureCache";
import { initializePickupTextures } from "./PickupTextureCache";
import { terrainDetailTextureCache } from "./TerrainDetailTextureCache";
import { waterTextureCache } from "./WaterTextureCache";

export async function initializeAllTextures(): Promise<void> {
  await Promise.all([
    projectileTextureCache.initialize(),
    initializePickupTextures(),
    terrainDetailTextureCache.initialize(),
    waterTextureCache.initialize(),
  ]);
}
