import {
  t as __t,
} from "spacetimedb";

export const BaseTerrain = {
  Ground: 0,
  Stream: 1,
  Road: 2
} as const;

export type BaseTerrain = typeof BaseTerrain[keyof typeof BaseTerrain];

export default __t.u8();
