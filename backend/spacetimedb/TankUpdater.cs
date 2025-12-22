using SpacetimeDB;
using static Types;

public static partial class TankUpdater
{
    private const double ARRIVAL_THRESHOLD = 0.1;

    [Table(Scheduled = nameof(UpdateTanks))]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct ScheduledTankUpdates
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
        public ulong LastTickAt;
    }

    [Reducer]
    public static void UpdateTanks(ReducerContext ctx, ScheduledTankUpdates args)
    {
        var currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var deltaTimeMicros = currentTime - args.LastTickAt;
        var deltaTime = deltaTimeMicros / 1_000_000.0;

        ctx.Db.ScheduledTankUpdates.ScheduledId.Update(args with
        {
            LastTickAt = currentTime
        });

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

            if (tank.Path.Length > 0)
            {
                var targetPos = tank.Path[0];
                var deltaX = targetPos.Position.X - tank.PositionX;
                var deltaY = targetPos.Position.Y - tank.PositionY;
                var distance = Math.Sqrt(deltaX * deltaX + deltaY * deltaY);

                var moveSpeed = tank.TopSpeed * targetPos.ThrottlePercent;
                var moveDistance = moveSpeed * deltaTime;

                if (distance <= ARRIVAL_THRESHOLD || moveDistance >= distance)
                {
                    var newPath = new PathEntry[tank.Path.Length - 1];
                    Array.Copy(tank.Path, 1, newPath, 0, newPath.Length);

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
                            var nextMoveSpeed = tank.TopSpeed * nextTarget.ThrottlePercent;

                            tank = tank with
                            {
                                PositionX = targetPos.Position.X,
                                PositionY = targetPos.Position.Y,
                                Velocity = new Vector2Float((float)(nextDirX * nextMoveSpeed), (float)(nextDirY * nextMoveSpeed)),
                                Path = newPath
                            };
                        }
                        else
                        {
                            tank = tank with
                            {
                                PositionX = targetPos.Position.X,
                                PositionY = targetPos.Position.Y,
                                Velocity = new Vector2Float(0, 0),
                                Path = newPath
                            };
                        }
                    }
                    else
                    {
                        tank = tank with
                        {
                            PositionX = targetPos.Position.X,
                            PositionY = targetPos.Position.Y,
                            Velocity = new Vector2Float(0, 0),
                            Path = newPath
                        };
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
                var targetTank = ctx.Db.tank.Id.Find(tank.Target);
                if (targetTank != null)
                {
                    var targetX = targetTank.Value.PositionX;
                    var targetY = targetTank.Value.PositionY;

                    if (tank.TargetLead > 0)
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

                    var deltaX = targetX - tank.PositionX;
                    var deltaY = targetY - tank.PositionY;
                    var aimAngle = Math.Atan2(deltaY, deltaX);
                    var normalizedAimAngle = Module.NormalizeAngleToTarget((float)aimAngle, tank.TurretRotation);

                    if (Math.Abs(tank.TargetTurretRotation - normalizedAimAngle) > 0.001)
                    {
                        tank = tank with { TargetTurretRotation = normalizedAimAngle };
                    }
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

            float centerX = tankTileX + 0.5f;
            float centerY = tankTileY + 0.5f;
            foreach (var pickup in ctx.Db.pickup.WorldId_PositionX_PositionY.Filter((args.WorldId, centerX, centerY)))
            {
                if (PickupSpawner.TryCollectPickup(ctx, ref tank, ref needsUpdate, pickup))
                {
                    break;
                }
            }

            if (needsUpdate)
            {
                ctx.Db.tank.Id.Update(tank);
            }
        }
    }


}
