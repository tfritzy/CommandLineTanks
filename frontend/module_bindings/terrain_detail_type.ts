import {
  t as __t,
} from "spacetimedb";

export const TerrainDetail = {
  None: 0,
  Cliff: 1,
  Rock: 2,
  Tree: 3,
  Bridge: 4,
  Fence: 5,
  HayBale: 6,
  Field: 7
} as const;

export type TerrainDetail = typeof TerrainDetail[keyof typeof TerrainDetail];

export default __t.u8();
