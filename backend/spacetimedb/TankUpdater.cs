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

            int newCollisionRegionX = Module.GetGridPosition(tank.PositionX / Module.COLLISION_REGION_SIZE);
            int newCollisionRegionY = Module.GetGridPosition(tank.PositionY / Module.COLLISION_REGION_SIZE);

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
                if (IsTankFacingTarget(tank, targetPos.Position, targetPos.Reverse))
                {
                    var deltaX = targetPos.Position.X - tank.PositionX;
                    var deltaY = targetPos.Position.Y - tank.PositionY;
                    var distance = Math.Sqrt(deltaX * deltaX + deltaY * deltaY);
                    var targetAngle = Math.Atan2(deltaY, deltaX);

                    if (targetPos.Reverse)
                    {
                        targetAngle += Math.PI;
                        if (targetAngle > Math.PI) targetAngle -= 2 * Math.PI;
                    }

                    var moveSpeed = tank.TopSpeed * targetPos.ThrottlePercent;
                    var moveDistance = moveSpeed * deltaTime;

                    if (tank.Velocity.X == 0 && tank.Velocity.Y == 0)
                    {
                        var dirX = Math.Cos(targetAngle);
                        var dirY = Math.Sin(targetAngle);

                        tank = tank with
                        {
                            BodyRotation = (float)targetAngle,
                            TargetBodyRotation = (float)targetAngle,
                            Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed)),
                            BodyAngularVelocity = 0
                        };
                        needsUpdate = true;
                    }
                    else if (distance <= ARRIVAL_THRESHOLD || moveDistance >= distance)
                    {
                        var newPath = new PathEntry[tank.Path.Length - 1];
                        Array.Copy(tank.Path, 1, newPath, 0, newPath.Length);
                        tank = tank with
                        {
                            PositionX = targetPos.Position.X,
                            PositionY = targetPos.Position.Y,
                            Velocity = new Vector2Float(0, 0),
                            BodyAngularVelocity = 0,
                            Path = newPath
                        };
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
                            Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed)),
                            BodyAngularVelocity = 0
                        };
                        needsUpdate = true;
                    }
                }
                else
                {
                    var deltaX = targetPos.Position.X - tank.PositionX;
                    var deltaY = targetPos.Position.Y - tank.PositionY;
                    var targetAngle = Math.Atan2(deltaY, deltaX);

                    if (targetPos.Reverse)
                    {
                        targetAngle += Math.PI;
                        if (targetAngle > Math.PI) targetAngle -= 2 * Math.PI;
                    }

                    var angleDiff = targetAngle - tank.BodyRotation;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                    var rotationAmount = tank.BodyRotationSpeed * deltaTime;

                    if (tank.BodyAngularVelocity == 0)
                    {
                        tank = tank with
                        {
                            TargetBodyRotation = (float)targetAngle,
                            Velocity = new Vector2Float(0, 0),
                            BodyAngularVelocity = (float)(Math.Sign(angleDiff) * tank.BodyRotationSpeed)
                        };
                        needsUpdate = true;
                    }
                    else if (Math.Abs(angleDiff) <= rotationAmount)
                    {
                        var moveSpeed = tank.TopSpeed * targetPos.ThrottlePercent;
                        var dirX = Math.Cos(targetAngle);
                        var dirY = Math.Sin(targetAngle);

                        tank = tank with
                        {
                            BodyRotation = (float)targetAngle,
                            TargetBodyRotation = (float)targetAngle,
                            Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed)),
                            BodyAngularVelocity = 0
                        };
                        needsUpdate = true;
                    }
                    else
                    {
                        rotationAmount = Math.Sign(angleDiff) * rotationAmount;
                        tank = tank with
                        {
                            BodyRotation = (float)(tank.BodyRotation + rotationAmount),
                            TargetBodyRotation = (float)targetAngle,
                            Velocity = new Vector2Float(0, 0),
                            BodyAngularVelocity = (float)(Math.Sign(angleDiff) * tank.BodyRotationSpeed)
                        };
                        needsUpdate = true;
                    }
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
                        var targetAngle = targetTank.Value.BodyRotation;
                        targetX += (float)(Math.Cos(targetAngle) * tank.TargetLead);
                        targetY += (float)(Math.Sin(targetAngle) * tank.TargetLead);
                    }

                    var deltaX = targetX - tank.PositionX;
                    var deltaY = targetY - tank.PositionY;
                    var aimAngle = Math.Atan2(deltaY, deltaX);

                    if (Math.Abs(tank.TargetTurretRotation - (float)aimAngle) > 0.001)
                    {
                        tank = tank with { TargetTurretRotation = (float)aimAngle };
                    }
                }
            }

            if (Math.Abs(tank.TurretRotation - tank.TargetTurretRotation) > 0.001)
            {
                var angleDiff = tank.TargetTurretRotation - tank.TurretRotation;
                while (angleDiff > MathF.PI) angleDiff -= 2 * MathF.PI;
                while (angleDiff < -MathF.PI) angleDiff += 2 * MathF.PI;

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

            int tankTileX = Module.GetGridPosition(tank.PositionX);
            int tankTileY = Module.GetGridPosition(tank.PositionY);

            foreach (var pickup in ctx.Db.pickup.WorldId_PositionX_PositionY.Filter((args.WorldId, tankTileX, tankTileY)))
            {
                if (Module.TryCollectPickup(ctx, ref tank, ref needsUpdate, pickup))
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

    private static bool IsTankFacingTarget(Module.Tank tank, Vector2 target, bool reverse = false, double tolerance = 0.02)
    {
        var deltaX = target.X - tank.PositionX;
        var deltaY = target.Y - tank.PositionY;
        var targetAngle = Math.Atan2(deltaY, deltaX);

        if (reverse)
        {
            targetAngle += Math.PI;
            if (targetAngle > Math.PI) targetAngle -= 2 * Math.PI;
        }

        var angleDiff = targetAngle - tank.BodyRotation;

        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        return Math.Abs(angleDiff) < tolerance;
    }


}
