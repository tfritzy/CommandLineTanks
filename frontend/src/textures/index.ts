export { projectileTextureCache } from "./ProjectileTextureCache";
export { redTeamPickupTextureCache, blueTeamPickupTextureCache, initializePickupTextures } from "./PickupTextureCache";
export { terrainDetailTextureCache } from "./TerrainDetailTextureCache";
export { renderToImageBitmap, drawTexture, type TextureImage, TEXTURE_DPR } from "./TextureRenderer";

import { projectileTextureCache } from "./ProjectileTextureCache";
import { initializePickupTextures } from "./PickupTextureCache";
import { terrainDetailTextureCache } from "./TerrainDetailTextureCache";

export async function initializeAllTextures(): Promise<void> {
  await Promise.all([
    projectileTextureCache.initialize(),
    initializePickupTextures(),
    terrainDetailTextureCache.initialize(),
  ]);
}
