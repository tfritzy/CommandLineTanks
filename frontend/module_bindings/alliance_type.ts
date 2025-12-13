import {
  t as __t,
} from "spacetimedb";

export const Alliance = {
  Red: 0,
  Blue: 1
} as const;

export type Alliance = typeof Alliance[keyof typeof Alliance];

export default __t.u8();
