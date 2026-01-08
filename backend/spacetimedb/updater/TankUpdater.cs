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
        private Dictionary<string, (Module.Tank, Module.TankMetadata, Module.TankPosition)?>? _fullTanksById;
        private Dictionary<(int, int), List<Module.Pickup>>? _pickupsByTile;
        private Dictionary<(int, int), List<Module.TerrainDetail>>? _terrainDetailsByTile;

        public TankUpdateContext(ReducerContext ctx, string worldId)
        {
            _ctx = ctx;
            _worldId = worldId;
        }

        public (Module.Tank, Module.TankMetadata, Module.TankPosition)? GetFullTankById(string tankId)
        {
            if (_fullTanksById == null)
            {
                _fullTanksById = new Dictionary<string, (Module.Tank, Module.TankMetadata, Module.TankPosition)?>();
            }

            if (!_fullTanksById.ContainsKey(tankId))
            {
                var tank = _ctx.Db.tank.Id.Find(tankId);
                var metadata = _ctx.Db.tank_metadata.TankId.Find(tankId);
                var position = _ctx.Db.tank_position.TankId.Find(tankId);

                if (tank != null && metadata != null && position != null)
                {
                    _fullTanksById[tankId] = (tank.Value, metadata.Value, position.Value);
                }
                else
                {
                    _fullTanksById[tankId] = null;
                }
            }

            return _fullTanksById[tankId];
        }

        public List<Module.Pickup> GetPickupsByTile(int tileX, int tileY)
        {
            if (_pickupsByTile == null)
            {
                _pickupsByTile = new Dictionary<(int, int), List<Module.Pickup>>();
            }

            var key = (tileX, tileY);
            if (!_pickupsByTile.ContainsKey(key))
            {
                var pickups = new List<Module.Pickup>();
                foreach (var pickup in _ctx.Db.pickup.WorldId_GridX_GridY.Filter((_worldId, tileX, tileY)))
                {
                    pickups.Add(pickup);
                }
                _pickupsByTile[key] = pickups;
            }

            return _pickupsByTile[key];
        }

        public List<Module.TerrainDetail> GetTerrainDetailsByTile(int tileX, int tileY)
        {
            if (_terrainDetailsByTile == null)
            {
                _terrainDetailsByTile = new Dictionary<(int, int), List<Module.TerrainDetail>>();
            }

            var key = (tileX, tileY);
            if (!_terrainDetailsByTile.ContainsKey(key))
            {
                var details = new List<Module.TerrainDetail>();
                foreach (var detail in _ctx.Db.terrain_detail.WorldId_GridX_GridY.Filter((_worldId, tileX, tileY)))
                {
                    details.Add(detail);
                }
                _terrainDetailsByTile[key] = details;
            }

            return _terrainDetailsByTile[key];
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
            bool needsTankUpdate = false;
            bool needsPositionUpdate = false;
            var tank = iTank;

            if (tank.Health <= 0)
            {
                continue;
            }

            var metadataQuery = ctx.Db.tank_metadata.TankId.Find(tank.Id);
            var positionQuery = ctx.Db.tank_position.TankId.Find(tank.Id);
            if (metadataQuery == null || positionQuery == null)
            {
                continue;
            }
            var metadata = metadataQuery.Value;
            var position = positionQuery.Value;

            int newCollisionRegionX = (int)(position.PositionX / Module.COLLISION_REGION_SIZE);
            int newCollisionRegionY = (int)(position.PositionY / Module.COLLISION_REGION_SIZE);

            if (newCollisionRegionX != position.CollisionRegionX || newCollisionRegionY != position.CollisionRegionY)
            {
                position = position with
                {
                    CollisionRegionX = newCollisionRegionX,
                    CollisionRegionY = newCollisionRegionY
                };
                needsPositionUpdate = true;
            }

            if (tank.RemainingImmunityMicros > 0)
            {
                var newRemainingImmunity = Math.Max(0, tank.RemainingImmunityMicros - (long)deltaTimeMicros);
                tank = tank with { RemainingImmunityMicros = newRemainingImmunity };
                needsTankUpdate = true;
            }

            var pathState = ctx.Db.tank_path.TankId.Find(tank.Id);
            if (pathState != null && pathState.Value.Path.Length > 0)
            {
                var currentPath = pathState.Value.Path;
                var targetPos = currentPath[0];
                var deltaX = targetPos.Position.X - position.PositionX;
                var deltaY = targetPos.Position.Y - position.PositionY;
                var distance = Math.Sqrt(deltaX * deltaX + deltaY * deltaY);

                var moveSpeed = metadata.TopSpeed * targetPos.ThrottlePercent;
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
                            var nextMoveSpeed = metadata.TopSpeed * nextTarget.ThrottlePercent;

                            var finalX = targetPos.Position.X + nextDirX * Math.Min(overshoot, nextDistance);
                            var finalY = targetPos.Position.Y + nextDirY * Math.Min(overshoot, nextDistance);

                            position = position with
                            {
                                PositionX = (float)finalX,
                                PositionY = (float)finalY,
                                Velocity = new Vector2Float((float)(nextDirX * nextMoveSpeed), (float)(nextDirY * nextMoveSpeed))
                            };
                        }
                        else
                        {
                            position = position with
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
                        position = position with
                        {
                            PositionX = targetPos.Position.X,
                            PositionY = targetPos.Position.Y,
                            Velocity = new Vector2Float(0, 0)
                        };

                        ctx.Db.tank_path.TankId.Delete(tank.Id);
                    }
                    needsPositionUpdate = true;
                }
                else
                {
                    var dirX = deltaX / distance;
                    var dirY = deltaY / distance;

                    position = position with
                    {
                        PositionX = (float)(position.PositionX + dirX * moveDistance),
                        PositionY = (float)(position.PositionY + dirY * moveDistance),
                        Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed))
                    };
                    needsPositionUpdate = true;
                }
            }

            if (tank.Target != null)
            {
                var targetFullTank = updateContext.GetFullTankById(tank.Target);
                if (targetFullTank != null && targetFullTank.Value.Item1.Health > 0)
                {
                    var (_, _, targetPosition) = targetFullTank.Value;
                    var targetX = targetPosition.PositionX;
                    var targetY = targetPosition.PositionY;

                    var distanceDeltaX = targetX - position.PositionX;
                    var distanceDeltaY = targetY - position.PositionY;
                    var distanceSquared = distanceDeltaX * distanceDeltaX + distanceDeltaY * distanceDeltaY;

                    if (distanceSquared > Module.MAX_TARGETING_RANGE * Module.MAX_TARGETING_RANGE)
                    {
                        tank = tank with { Target = null, Message = "Target lost" };
                        needsTankUpdate = true;
                    }
                    else
                    {
                        if (tank.TargetLead > 0)
                        {
                            var targetVelocity = targetPosition.Velocity;
                            var velocityMagnitude = Math.Sqrt(targetVelocity.X * targetVelocity.X + targetVelocity.Y * targetVelocity.Y);
                            if (velocityMagnitude > 0)
                            {
                                var velocityAngle = Math.Atan2(targetVelocity.Y, targetVelocity.X);
                                targetX += (float)(Math.Cos(velocityAngle) * tank.TargetLead);
                                targetY += (float)(Math.Sin(velocityAngle) * tank.TargetLead);
                            }
                        }

                        var deltaX = targetX - position.PositionX;
                        var deltaY = targetY - position.PositionY;
                        var aimAngle = Math.Atan2(deltaY, deltaX);
                        var normalizedAimAngle = Module.NormalizeAngleToTarget((float)aimAngle, tank.TurretRotation);

                        if (Math.Abs(tank.TargetTurretRotation - normalizedAimAngle) > 0.001)
                        {
                            tank = tank with { TargetTurretRotation = normalizedAimAngle };
                            needsTankUpdate = true;
                        }
                    }
                }
                else
                {
                    tank = tank with { Target = null };
                    needsTankUpdate = true;
                }
            }

            if (Math.Abs(tank.TurretRotation - tank.TargetTurretRotation) > 0.001)
            {
                var angleDiff = Module.GetNormalizedAngleDifference(tank.TargetTurretRotation, tank.TurretRotation);

                var rotationAmount = metadata.TurretRotationSpeed * deltaTime;

                if (tank.TurretAngularVelocity == 0)
                {
                    tank = tank with
                    {
                        TurretAngularVelocity = (float)(Math.Sign(angleDiff) * metadata.TurretRotationSpeed)
                    };
                    needsTankUpdate = true;
                }
                else if (Math.Abs(angleDiff) <= rotationAmount)
                {
                    tank = tank with
                    {
                        TurretRotation = tank.TargetTurretRotation,
                        TurretAngularVelocity = 0
                    };
                    needsTankUpdate = true;
                }
                else
                {
                    rotationAmount = Math.Sign(angleDiff) * rotationAmount;
                    tank = tank with
                    {
                        TurretRotation = (float)(tank.TurretRotation + rotationAmount),
                        TurretAngularVelocity = (float)(Math.Sign(angleDiff) * metadata.TurretRotationSpeed)
                    };
                    needsTankUpdate = true;
                }
            }

            int tankTileX = (int)position.PositionX;
            int tankTileY = (int)position.PositionY;

            foreach (var pickup in updateContext.GetPickupsByTile(tankTileX, tankTileY))
            {
                if (PickupSpawner.TryCollectPickup(ctx, ref tank, ref needsTankUpdate, pickup))
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

            if (needsTankUpdate)
            {
                ctx.Db.tank.Id.Update(tank);
            }

            if (needsPositionUpdate)
            {
                position = position with { UpdatedAt = currentTime };
                ctx.Db.tank_position.TankId.Update(position);
            }
        }
    }


}
