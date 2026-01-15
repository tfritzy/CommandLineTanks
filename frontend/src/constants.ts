import { COLORS } from "./theme/colors";
import { type Infer } from "spacetimedb";
import Gun from "../module_bindings/gun_type";

export const UNIT_TO_PIXEL = 50;

export const GUN_BARREL_LENGTH = 0.4;

export const INTERPOLATION_DELAY = 100;
export const BUFFER_DURATION = 200;

export const PEN_SIZE = 5;

export const TANK_COLLISION_RADIUS = 0.5;

export const TERRAIN_DETAIL_RADIUS = {
  ROCK: 0.38,
  TREE: 0.648,
  HAY_BALE: 0.35,
};

export const PROJECTILE_SPEED = 7.0;

export const BASE_GUN: Infer<typeof Gun> = {
  gunType: { tag: "Base" } as const,
  ammo: undefined,
  projectileCount: 1,
  spreadAngle: 0,
  damage: 20,
  trackingStrength: 0,
  trackingRadius: 0,
  projectileType: { tag: "Normal" } as const,
  lifetimeSeconds: 10.0,
  maxCollisions: 1,
  passThroughTerrain: false,
  collisionRadius: 0.1,
  explosionRadius: undefined,
  explosionTrigger: { tag: "None" } as const,
  damping: undefined,
  bounce: false,
  projectileSize: 0.15,
  projectileSpeed: PROJECTILE_SPEED,
};

export { COLORS };
