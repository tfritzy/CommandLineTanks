using SpacetimeDB;
using static Types;
using System.Collections.Generic;
using System.Diagnostics;

public static partial class TankUpdater
{
    private const double ARRIVAL_THRESHOLD = 0.1;

    [Table(Scheduled = nameof(UpdateTanks))]
    public partial struct ScheduledTankUpdates
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string GameId;
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

        foreach (var iTank in ctx.Db.tank.GameId.Filter(args.GameId))
        {
            bool needsTankUpdate = false;
            bool needsTransformUpdate = false;
            var tank = iTank;

            if (tank.Health <= 0)
            {
                continue;
            }

            var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
            if (transformQuery == null)
            {
                continue;
            }
            var transform = transformQuery.Value;

            int newCollisionRegionX = (int)(transform.PositionX / Module.COLLISION_REGION_SIZE);
            int newCollisionRegionY = (int)(transform.PositionY / Module.COLLISION_REGION_SIZE);

            if (newCollisionRegionX != transform.CollisionRegionX || newCollisionRegionY != transform.CollisionRegionY)
            {
                transform = transform with
                {
                    CollisionRegionX = newCollisionRegionX,
                    CollisionRegionY = newCollisionRegionY
                };
                needsTransformUpdate = true;
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
                var deltaX = targetPos.Position.X - transform.PositionX;
                var deltaY = targetPos.Position.Y - transform.PositionY;
                var distance = Math.Sqrt(deltaX * deltaX + deltaY * deltaY);

                var moveSpeed = tank.TopSpeed;
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
                            var nextMoveSpeed = tank.TopSpeed;

                            var finalX = targetPos.Position.X + nextDirX * Math.Min(overshoot, nextDistance);
                            var finalY = targetPos.Position.Y + nextDirY * Math.Min(overshoot, nextDistance);

                            transform = transform with
                            {
                                PositionX = (float)finalX,
                                PositionY = (float)finalY,
                                Velocity = new Vector2Float((float)(nextDirX * nextMoveSpeed), (float)(nextDirY * nextMoveSpeed))
                            };
                        }
                        else
                        {
                            transform = transform with
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
                        transform = transform with
                        {
                            PositionX = targetPos.Position.X,
                            PositionY = targetPos.Position.Y,
                            Velocity = new Vector2Float(0, 0)
                        };

                        ctx.Db.tank_path.TankId.Delete(tank.Id);
                    }
                    needsTransformUpdate = true;
                }
                else
                {
                    var dirX = deltaX / distance;
                    var dirY = deltaY / distance;

                    transform = transform with
                    {
                        PositionX = (float)(transform.PositionX + dirX * moveDistance),
                        PositionY = (float)(transform.PositionY + dirY * moveDistance),
                        Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed))
                    };
                    needsTransformUpdate = true;
                }
            }

            if (tank.Target != null)
            {
                var targetTankQuery = ctx.Db.tank.Id.Find(tank.Target);
                var targetTransformQuery = ctx.Db.tank_transform.TankId.Find(tank.Target);

                if (targetTankQuery != null && targetTransformQuery != null && targetTankQuery.Value.Health > 0)
                {
                    var targetTransform = targetTransformQuery.Value;
                    var targetX = targetTransform.PositionX;
                    var targetY = targetTransform.PositionY;

                    var distanceDeltaX = targetX - transform.PositionX;
                    var distanceDeltaY = targetY - transform.PositionY;
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
                            var targetVelocity = targetTransform.Velocity;
                            var velocityMagnitude = Math.Sqrt(targetVelocity.X * targetVelocity.X + targetVelocity.Y * targetVelocity.Y);
                            if (velocityMagnitude > 0)
                            {
                                var velocityAngle = Math.Atan2(targetVelocity.Y, targetVelocity.X);
                                targetX += (float)(Math.Cos(velocityAngle) * tank.TargetLead);
                                targetY += (float)(Math.Sin(velocityAngle) * tank.TargetLead);
                            }
                        }

                        var deltaX = targetX - transform.PositionX;
                        var deltaY = targetY - transform.PositionY;
                        var aimAngle = Math.Atan2(deltaY, deltaX);
                        var normalizedAimAngle = Module.NormalizeAngleToTarget((float)aimAngle, transform.TurretRotation);

                        if (Math.Abs(transform.TargetTurretRotation - normalizedAimAngle) > 0.001)
                        {
                            transform = transform with { TargetTurretRotation = normalizedAimAngle };
                            needsTransformUpdate = true;
                        }
                    }
                }
                else
                {
                    tank = tank with { Target = null };
                    needsTankUpdate = true;
                }
            }

            if (Math.Abs(transform.TurretRotation - transform.TargetTurretRotation) > 0.001)
            {
                var angleDiff = Module.GetNormalizedAngleDifference(transform.TargetTurretRotation, transform.TurretRotation);

                var rotationAmount = tank.TurretRotationSpeed * deltaTime;

                if (transform.TurretAngularVelocity == 0)
                {
                    transform = transform with
                    {
                        TurretAngularVelocity = (float)(Math.Sign(angleDiff) * tank.TurretRotationSpeed)
                    };
                    needsTransformUpdate = true;
                }
                else if (Math.Abs(angleDiff) <= rotationAmount)
                {
                    transform = transform with
                    {
                        TurretRotation = transform.TargetTurretRotation,
                        TurretAngularVelocity = 0
                    };
                    needsTransformUpdate = true;
                }
                else
                {
                    rotationAmount = Math.Sign(angleDiff) * rotationAmount;
                    transform = transform with
                    {
                        TurretRotation = (float)(transform.TurretRotation + rotationAmount),
                        TurretAngularVelocity = (float)(Math.Sign(angleDiff) * tank.TurretRotationSpeed)
                    };
                    needsTransformUpdate = true;
                }
            }

            int tankTileX = (int)transform.PositionX;
            int tankTileY = (int)transform.PositionY;

            foreach (var pickup in ctx.Db.pickup.GameId_GridX_GridY.Filter((args.GameId, tankTileX, tankTileY)))
            {
                if (PickupSpawner.TryCollectPickup(ctx, ref tank, ref needsTankUpdate, pickup))
                {
                    break;
                }
            }

            foreach (var terrainDetail in ctx.Db.terrain_detail.GameId_GridX_GridY.Filter((args.GameId, tankTileX, tankTileY)))
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

            if (needsTransformUpdate)
            {
                transform = transform with { UpdatedAt = currentTime };
                ctx.Db.tank_transform.TankId.Update(transform);
            }
        }
    }
}
