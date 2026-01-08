import { getConnection } from "../spacetimedb-connection";
import { Identity } from "spacetimedb";

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
  guns: Array<{ gunType: number; ammo?: number }>;
  owner: Identity;
  name: string;
  targetCode: string;
  joinCode: string;
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
  const metadata = connection.db.tankMetadata.tankId.find(tankId);
  const position = connection.db.tankPosition.tankId.find(tankId);

  if (!tank || !metadata || !position) return null;

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
    turretAngularVelocity: tank.turretAngularVelocity,
    turretRotation: tank.turretRotation,
    targetTurretRotation: tank.targetTurretRotation,
    hasShield: tank.hasShield,
    remainingImmunityMicros: tank.remainingImmunityMicros,
    deathTimestamp: tank.deathTimestamp,
    selectedGunIndex: tank.selectedGunIndex,
    lastDamagedBy: tank.lastDamagedBy,
    guns: tank.guns,
    owner: metadata.owner,
    name: metadata.name,
    targetCode: metadata.targetCode,
    joinCode: metadata.joinCode,
    alliance: metadata.alliance,
    isBot: metadata.isBot,
    maxHealth: metadata.maxHealth,
    positionX: position.positionX,
    positionY: position.positionY,
    velocity: position.velocity,
    updatedAt: position.updatedAt,
  };
}

export function getTankMetadata(tankId: string) {
  const connection = getConnection();
  if (!connection) return null;
  return connection.db.tankMetadata.tankId.find(tankId);
}

export function getTankPosition(tankId: string) {
  const connection = getConnection();
  if (!connection) return null;
  return connection.db.tankPosition.tankId.find(tankId);
}

export function getTankMetadataByOwner(worldId: string, owner: Identity) {
  const connection = getConnection();
  if (!connection) return null;
  for (const metadata of connection.db.tankMetadata.worldId.filter(worldId)) {
    if (metadata.owner.isEqual(owner)) {
      return metadata;
    }
  }
  return null;
}
