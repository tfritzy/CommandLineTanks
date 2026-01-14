import { getConnection } from "../spacetimedb-connection";
import { Identity, type Infer } from "spacetimedb";
import Gun from "../../module_bindings/gun_type";

export interface FullTankData {
  id: string;
  gameId: string;
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

export function getTankGuns(tankId: string): Infer<typeof Gun>[] {
  const connection = getConnection();
  if (!connection) return [];
  
  const gunEntries: Array<{ slotIndex: number; gun: Infer<typeof Gun> }> = [];
  for (const tankGun of connection.db.tankGun.TankId.filter(tankId)) {
    gunEntries.push({ slotIndex: tankGun.slotIndex, gun: tankGun.gun });
  }
  gunEntries.sort((a, b) => a.slotIndex - b.slotIndex);
  return gunEntries.map(entry => entry.gun);
}

export function getFullTank(tankId: string): FullTankData | null {
  const connection = getConnection();
  if (!connection) return null;

  const tank = connection.db.tank.id.find(tankId);
  const transform = connection.db.tankTransform.tankId.find(tankId);

  if (!tank || !transform) return null;

  return {
    id: tank.id,
    gameId: tank.gameId,
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
    guns: getTankGuns(tankId),
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

export function getTankByOwner(gameId: string, owner: Identity) {
  const connection = getConnection();
  if (!connection) return null;
  for (const tank of connection.db.tank.GameId.filter(gameId)) {
    if (tank.owner.isEqual(owner)) {
      return tank;
    }
  }
  return null;
}
