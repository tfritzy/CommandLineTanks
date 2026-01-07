using SpacetimeDB;
using static Types;
using System.Collections.Generic;

public static partial class TankUpdater
{
    private const double ARRIVAL_THRESHOLD = 0.1;

    public class TankUpdateContext
    {
        private readonly ReducerContext _ctx;
        private readonly string _worldId;
        private Dictionary<(int, int), List<Module.SmokeCloud>>? _smokeCloudsByRegion;
        private Dictionary<string, Module.Tank?>? _tanksById;
        private Dictionary<(int, int), List<Module.Pickup>>? _pickupsByTile;
        private Dictionary<(int, int), List<Module.TerrainDetail>>? _terrainDetailsByTile;

        public TankUpdateContext(ReducerContext ctx, string worldId)
        {
            _ctx = ctx;
            _worldId = worldId;
        }

        public List<Module.SmokeCloud> GetSmokeCloudsByRegion(int regionX, int regionY)
        {
            _smokeCloudsByRegion ??= new Dictionary<(int, int), List<Module.SmokeCloud>>();

            var key = (regionX, regionY);
            if (!_smokeCloudsByRegion.TryGetValue(key, out var clouds))
            {
                clouds = new List<Module.SmokeCloud>();
                foreach (var cloud in _ctx.Db.smoke_cloud.WorldId_CollisionRegionX_CollisionRegionY.Filter((_worldId, regionX, regionY)))
                {
                    clouds.Add(cloud);
                }
                _smokeCloudsByRegion[key] = clouds;
            }

            return clouds;
        }

        public Module.Tank? GetTankById(string tankId)
        {
            _tanksById ??= new Dictionary<string, Module.Tank?>();

            if (!_tanksById.TryGetValue(tankId, out var tank))
            {
                tank = _ctx.Db.tank.Id.Find(tankId);
                _tanksById[tankId] = tank;
            }

            return tank;
        }

        public List<Module.Pickup> GetPickupsByTile(int tileX, int tileY)
        {
            _pickupsByTile ??= new Dictionary<(int, int), List<Module.Pickup>>();

            var key = (tileX, tileY);
            if (!_pickupsByTile.TryGetValue(key, out var pickups))
            {
                pickups = new List<Module.Pickup>();
                foreach (var pickup in _ctx.Db.pickup.WorldId_GridX_GridY.Filter((_worldId, tileX, tileY)))
                {
                    pickups.Add(pickup);
                }
                _pickupsByTile[key] = pickups;
            }

            return pickups;
        }

        public List<Module.TerrainDetail> GetTerrainDetailsByTile(int tileX, int tileY)
        {
            _terrainDetailsByTile ??= new Dictionary<(int, int), List<Module.TerrainDetail>>();

            var key = (tileX, tileY);
            if (!_terrainDetailsByTile.TryGetValue(key, out var details))
            {
                details = new List<Module.TerrainDetail>();
                foreach (var detail in _ctx.Db.terrain_detail.WorldId_GridX_GridY.Filter((_worldId, tileX, tileY)))
                {
                    details.Add(detail);
                }
                _terrainDetailsByTile[key] = details;
            }

            return details;
        }
    }

    [Table(Scheduled = nameof(UpdateTanks))]
    public partial struct ScheduledTankUpdates
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
        public ulong LastTickAt;
        public ulong TickCount;
    }

    private static bool TryDecrementCooldown(
        ref Module.Tank tank,
        long currentValue,
        ulong deltaTimeMicros,
        System.Func<Module.Tank, long, Module.Tank> updateFunc)
    {
        if (currentValue <= 0)
        {
            return false;
        }

        var newValue = Math.Max(0, currentValue - (long)deltaTimeMicros);
        tank = updateFunc(tank, newValue);
        return true;
    }

    [Reducer]
    public static void UpdateTanks(ReducerContext ctx, ScheduledTankUpdates args)
    {
        var currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var deltaTimeMicros = currentTime - args.LastTickAt;
        var deltaTime = deltaTimeMicros / 1_000_000.0;

        var newTickCount = args.TickCount + 1;

        ctx.Db.ScheduledTankUpdates.ScheduledId.Update(args with
        {
            LastTickAt = currentTime,
            TickCount = newTickCount
        });

        var updateContext = new TankUpdateContext(ctx, args.WorldId);

        foreach (var iTank in ctx.Db.tank.WorldId.Filter(args.WorldId))
        {
            bool needsUpdate = false;
            var tank = iTank;

            if (tank.Health <= 0)
            {
                continue;
            }

            int newCollisionRegionX = (int)(tank.PositionX / Module.COLLISION_REGION_SIZE);
            int newCollisionRegionY = (int)(tank.PositionY / Module.COLLISION_REGION_SIZE);

            if (newCollisionRegionX != tank.CollisionRegionX || newCollisionRegionY != tank.CollisionRegionY)
            {
                tank = tank with
                {
                    CollisionRegionX = newCollisionRegionX,
                    CollisionRegionY = newCollisionRegionY
                };
                needsUpdate = true;
            }

            needsUpdate |= TryDecrementCooldown(ref tank, tank.RemainingOverdriveDurationMicros, deltaTimeMicros,
                (t, v) => t with { RemainingOverdriveDurationMicros = v });

            needsUpdate |= TryDecrementCooldown(ref tank, tank.RemainingSmokescreenCooldownMicros, deltaTimeMicros,
                (t, v) => t with { RemainingSmokescreenCooldownMicros = v });

            needsUpdate |= TryDecrementCooldown(ref tank, tank.RemainingOverdriveCooldownMicros, deltaTimeMicros,
                (t, v) => t with { RemainingOverdriveCooldownMicros = v });

            needsUpdate |= TryDecrementCooldown(ref tank, tank.RemainingImmunityMicros, deltaTimeMicros,
                (t, v) => t with { RemainingImmunityMicros = v });

            needsUpdate |= TryDecrementCooldown(ref tank, tank.RemainingRepairCooldownMicros, deltaTimeMicros,
                (t, v) => t with { RemainingRepairCooldownMicros = v });

            if (tank.IsRepairing && newTickCount % Module.REPAIR_TICK_INTERVAL == 0)
            {
                var newHealth = Math.Min(tank.MaxHealth, tank.Health + Module.REPAIR_HEALTH_PER_TICK);

                if (newHealth >= tank.MaxHealth)
                {
                    tank = tank with
                    {
                        Health = tank.MaxHealth,
                        IsRepairing = false,
                        Message = "Repair complete"
                    };
                    needsUpdate = true;
                }
                else
                {
                    tank = tank with { Health = newHealth };
                    needsUpdate = true;
                }
            }

            var pathState = ctx.Db.tank_path.TankId.Find(tank.Id);
            if (pathState != null && pathState.Value.Path.Length > 0)
            {
                var currentPath = pathState.Value.Path;
                var targetPos = currentPath[0];
                var deltaX = targetPos.Position.X - tank.PositionX;
                var deltaY = targetPos.Position.Y - tank.PositionY;
                var distance = Math.Sqrt(deltaX * deltaX + deltaY * deltaY);

                var speedMultiplier = tank.RemainingOverdriveDurationMicros > 0 ? Module.OVERDRIVE_SPEED_MULTIPLIER : 1.0f;
                var moveSpeed = tank.TopSpeed * targetPos.ThrottlePercent * speedMultiplier;
                var moveDistance = moveSpeed * deltaTime;

                if (distance <= ARRIVAL_THRESHOLD || moveDistance >= distance)
                {
                    var overshoot = moveDistance - distance;
                    var newPath = new PathEntry[currentPath.Length - 1];
                    Array.Copy(currentPath, 1, newPath, 0, newPath.Length);

                    if (newPath.Length > 0)
                    {
                        var nextTarget = newPath[0];
                        var nextDeltaX = nextTarget.Position.X - targetPos.Position.X;
                        var nextDeltaY = nextTarget.Position.Y - targetPos.Position.Y;
                        var nextDistance = Math.Sqrt(nextDeltaX * nextDeltaX + nextDeltaY * nextDeltaY);

                        if (nextDistance > 0)
                        {
                            var nextDirX = nextDeltaX / nextDistance;
                            var nextDirY = nextDeltaY / nextDistance;
                            var nextSpeedMultiplier = tank.RemainingOverdriveDurationMicros > 0 ? Module.OVERDRIVE_SPEED_MULTIPLIER : 1.0f;
                            var nextMoveSpeed = tank.TopSpeed * nextTarget.ThrottlePercent * nextSpeedMultiplier;

                            var finalX = targetPos.Position.X + nextDirX * Math.Min(overshoot, nextDistance);
                            var finalY = targetPos.Position.Y + nextDirY * Math.Min(overshoot, nextDistance);

                            tank = tank with
                            {
                                PositionX = (float)finalX,
                                PositionY = (float)finalY,
                                Velocity = new Vector2Float((float)(nextDirX * nextMoveSpeed), (float)(nextDirY * nextMoveSpeed))
                            };
                        }
                        else
                        {
                            tank = tank with
                            {
                                PositionX = targetPos.Position.X,
                                PositionY = targetPos.Position.Y,
                                Velocity = new Vector2Float(0, 0)
                            };
                        }

                        ctx.Db.tank_path.TankId.Update(pathState.Value with { Path = newPath });
                    }
                    else
                    {
                        tank = tank with
                        {
                            PositionX = targetPos.Position.X,
                            PositionY = targetPos.Position.Y,
                            Velocity = new Vector2Float(0, 0)
                        };

                        ctx.Db.tank_path.TankId.Delete(tank.Id);
                    }
                    needsUpdate = true;
                }
                else
                {
                    var dirX = deltaX / distance;
                    var dirY = deltaY / distance;

                    tank = tank with
                    {
                        PositionX = (float)(tank.PositionX + dirX * moveDistance),
                        PositionY = (float)(tank.PositionY + dirY * moveDistance),
                        Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed))
                    };
                    needsUpdate = true;
                }
            }

            if (tank.Target != null)
            {
                var targetTank = updateContext.GetTankById(tank.Target);
                if (targetTank != null && targetTank.Value.Health > 0)
                {
                    var targetX = targetTank.Value.PositionX;
                    var targetY = targetTank.Value.PositionY;

                    var distanceDeltaX = targetX - tank.PositionX;
                    var distanceDeltaY = targetY - tank.PositionY;
                    var distanceSquared = distanceDeltaX * distanceDeltaX + distanceDeltaY * distanceDeltaY;

                    if (distanceSquared > Module.MAX_TARGETING_RANGE * Module.MAX_TARGETING_RANGE)
                    {
                        tank = tank with { Target = null, Message = "Target lost" };
                        needsUpdate = true;
                    }
                    else
                    {
                        int targetCollisionRegionX = (int)(targetTank.Value.PositionX / Module.COLLISION_REGION_SIZE);
                        int targetCollisionRegionY = (int)(targetTank.Value.PositionY / Module.COLLISION_REGION_SIZE);

                        int searchRadius = (int)Math.Ceiling(Module.SMOKESCREEN_RADIUS / Module.COLLISION_REGION_SIZE);
                        bool targetInSmoke = false;

                        for (int dx = -searchRadius; dx <= searchRadius && !targetInSmoke; dx++)
                        {
                            for (int dy = -searchRadius; dy <= searchRadius && !targetInSmoke; dy++)
                            {
                                int regionX = targetCollisionRegionX + dx;
                                int regionY = targetCollisionRegionY + dy;

                                var smokeClouds = updateContext.GetSmokeCloudsByRegion(regionX, regionY);
                                foreach (var smokeCloud in smokeClouds)
                                {
                                    var smokeDx = targetTank.Value.PositionX - smokeCloud.PositionX;
                                    var smokeDy = targetTank.Value.PositionY - smokeCloud.PositionY;
                                    var smokeDistanceSquared = smokeDx * smokeDx + smokeDy * smokeDy;

                                    if (smokeDistanceSquared <= smokeCloud.Radius * smokeCloud.Radius)
                                    {
                                        targetInSmoke = true;
                                        break;
                                    }
                                }
                            }
                        }

                        if (targetInSmoke)
                        {
                            tank = tank with { Target = null, Message = "Target lost" };
                            needsUpdate = true;
                        }
                        else if (tank.TargetLead > 0)
                        {
                            var targetVelocity = targetTank.Value.Velocity;
                            var velocityMagnitude = Math.Sqrt(targetVelocity.X * targetVelocity.X + targetVelocity.Y * targetVelocity.Y);
                            if (velocityMagnitude > 0)
                            {
                                var velocityAngle = Math.Atan2(targetVelocity.Y, targetVelocity.X);
                                targetX += (float)(Math.Cos(velocityAngle) * tank.TargetLead);
                                targetY += (float)(Math.Sin(velocityAngle) * tank.TargetLead);
                            }
                        }

                        if (!targetInSmoke)
                        {
                            var deltaX = targetX - tank.PositionX;
                            var deltaY = targetY - tank.PositionY;
                            var aimAngle = Math.Atan2(deltaY, deltaX);
                            var normalizedAimAngle = Module.NormalizeAngleToTarget((float)aimAngle, tank.TurretRotation);

                            if (Math.Abs(tank.TargetTurretRotation - normalizedAimAngle) > 0.001)
                            {
                                tank = tank with { TargetTurretRotation = normalizedAimAngle };
                                needsUpdate = true;
                            }
                        }
                    }
                }
                else
                {
                    tank = tank with { Target = null };
                    needsUpdate = true;
                }
            }

            if (Math.Abs(tank.TurretRotation - tank.TargetTurretRotation) > 0.001)
            {
                var angleDiff = Module.GetNormalizedAngleDifference(tank.TargetTurretRotation, tank.TurretRotation);

                var rotationAmount = tank.TurretRotationSpeed * deltaTime;

                if (tank.TurretAngularVelocity == 0)
                {
                    tank = tank with
                    {
                        TurretAngularVelocity = (float)(Math.Sign(angleDiff) * tank.TurretRotationSpeed)
                    };
                    needsUpdate = true;
                }
                else if (Math.Abs(angleDiff) <= rotationAmount)
                {
                    tank = tank with
                    {
                        TurretRotation = tank.TargetTurretRotation,
                        TurretAngularVelocity = 0
                    };
                    needsUpdate = true;
                }
                else
                {
                    rotationAmount = Math.Sign(angleDiff) * rotationAmount;
                    tank = tank with
                    {
                        TurretRotation = (float)(tank.TurretRotation + rotationAmount),
                        TurretAngularVelocity = (float)(Math.Sign(angleDiff) * tank.TurretRotationSpeed)
                    };
                    needsUpdate = true;
                }
            }

            int tankTileX = (int)tank.PositionX;
            int tankTileY = (int)tank.PositionY;

            foreach (var pickup in updateContext.GetPickupsByTile(tankTileX, tankTileY))
            {
                if (PickupSpawner.TryCollectPickup(ctx, ref tank, ref needsUpdate, pickup))
                {
                    break;
                }
            }

            foreach (var terrainDetail in updateContext.GetTerrainDetailsByTile(tankTileX, tankTileY))
            {
                if (terrainDetail.Type == TerrainDetailType.FenceEdge || terrainDetail.Type == TerrainDetailType.FenceCorner)
                {
                    ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);
                }
            }

            if (needsUpdate)
            {
                tank = tank with { UpdatedAt = currentTime };
                ctx.Db.tank.Id.Update(tank);
            }
        }
    }


}
