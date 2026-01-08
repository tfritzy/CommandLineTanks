import { getConnection } from "../spacetimedb-connection";
import { Identity, type Infer } from "spacetimedb";
import Gun from "../../module_bindings/gun_type";

export interface FullTankData {
  id: string;
  worldId: string;
  health: number;
  kills: number;
  deaths: number;
  killStreak: number;
  target: string | undefined;
  targetLead: number;
  message: string | undefined;
  turretAngularVelocity: number;
  turretRotation: number;
  targetTurretRotation: number;
  hasShield: boolean;
  remainingImmunityMicros: bigint;
  deathTimestamp: bigint;
  selectedGunIndex: number;
  lastDamagedBy: Identity | undefined;
  guns: Infer<typeof Gun>[];
  owner: Identity;
  name: string;
  targetCode: string;
  joinCode: string | undefined;
  alliance: number;
  isBot: boolean;
  maxHealth: number;
  positionX: number;
  positionY: number;
  velocity: { x: number; y: number };
  updatedAt: bigint;
}

export function getFullTank(tankId: string): FullTankData | null {
  const connection = getConnection();
  if (!connection) return null;

  const tank = connection.db.tank.id.find(tankId);
  const transform = connection.db.tankTransform.tankId.find(tankId);

  if (!tank || !transform) return null;

  return {
    id: tank.id,
    worldId: tank.worldId,
    health: tank.health,
    kills: tank.kills,
    deaths: tank.deaths,
    killStreak: tank.killStreak,
    target: tank.target,
    targetLead: tank.targetLead,
    message: tank.message,
    turretAngularVelocity: transform.turretAngularVelocity,
    turretRotation: transform.turretRotation,
    targetTurretRotation: transform.targetTurretRotation,
    hasShield: tank.hasShield,
    remainingImmunityMicros: tank.remainingImmunityMicros,
    deathTimestamp: tank.deathTimestamp,
    selectedGunIndex: tank.selectedGunIndex,
    lastDamagedBy: tank.lastDamagedBy,
    guns: tank.guns,
    owner: tank.owner,
    name: tank.name,
    targetCode: tank.targetCode,
    joinCode: tank.joinCode,
    alliance: tank.alliance,
    isBot: tank.isBot,
    maxHealth: tank.maxHealth,
    positionX: transform.positionX,
    positionY: transform.positionY,
    velocity: transform.velocity,
    updatedAt: transform.updatedAt,
  };
}

export function getTank(tankId: string) {
  const connection = getConnection();
  if (!connection) return null;
  return connection.db.tank.id.find(tankId);
}

export function getTankTransform(tankId: string) {
  const connection = getConnection();
  if (!connection) return null;
  return connection.db.tankTransform.tankId.find(tankId);
}

export function getTankByOwner(worldId: string, owner: Identity) {
  const connection = getConnection();
  if (!connection) return null;
  for (const tank of connection.db.tank.WorldId.filter(worldId)) {
    if (tank.owner.isEqual(owner)) {
      return tank;
    }
  }
  return null;
}
