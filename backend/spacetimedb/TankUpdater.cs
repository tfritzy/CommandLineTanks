using SpacetimeDB;
using static Types;

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

        foreach (var tank in ctx.Db.tank.WorldId.Filter(args.WorldId))
        {
            if (tank.Path.Length > 0)
            {
                var targetPos = tank.Path[0];
                if (IsTankFacingTarget(tank, targetPos.Position))
                {
                    var deltaX = targetPos.Position.X - tank.PositionX;
                    var deltaY = targetPos.Position.Y - tank.PositionY;
                    var distance = Math.Sqrt(deltaX * deltaX + deltaY * deltaY);

                    var moveSpeed = tank.TopSpeed * targetPos.ThrottlePercent;
                    var moveDistance = moveSpeed * deltaTime;

                    if (tank.Velocity.X == 0 && tank.Velocity.Y == 0)
                    {
                        var dirX = deltaX / distance;
                        var dirY = deltaY / distance;

                        ctx.Db.tank.Id.Update(tank with
                        {
                            Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed)),
                            BodyAngularVelocity = 0
                        });
                    }
                    else if (distance <= ARRIVAL_THRESHOLD || moveDistance >= distance)
                    {
                        var newPath = new PathEntry[tank.Path.Length - 1];
                        Array.Copy(tank.Path, 1, newPath, 0, newPath.Length);
                        ctx.Db.tank.Id.Update(tank with
                        {
                            PositionX = targetPos.Position.X,
                            PositionY = targetPos.Position.Y,
                            Velocity = new Vector2Float(0, 0),
                            BodyAngularVelocity = 0,
                            Path = newPath
                        });
                    }
                    else
                    {
                        var dirX = deltaX / distance;
                        var dirY = deltaY / distance;

                        ctx.Db.tank.Id.Update(tank with
                        {
                            PositionX = (float)(tank.PositionX + dirX * moveDistance),
                            PositionY = (float)(tank.PositionY + dirY * moveDistance),
                            Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed)),
                            BodyAngularVelocity = 0
                        });
                    }
                }
                else
                {
                    var deltaX = targetPos.Position.X - tank.PositionX;
                    var deltaY = targetPos.Position.Y - tank.PositionY;
                    var targetAngle = Math.Atan2(deltaY, deltaX);

                    var angleDiff = targetAngle - tank.BodyRotation;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                    var rotationAmount = tank.BodyRotationSpeed * deltaTime;

                    if (tank.BodyAngularVelocity == 0)
                    {
                        ctx.Db.tank.Id.Update(tank with
                        {
                            TargetBodyRotation = (float)targetAngle,
                            Velocity = new Vector2Float(0, 0),
                            BodyAngularVelocity = (float)(Math.Sign(angleDiff) * tank.BodyRotationSpeed)
                        });
                    }
                    else if (Math.Abs(angleDiff) <= rotationAmount)
                    {
                        var moveSpeed = tank.TopSpeed * targetPos.ThrottlePercent;
                        var dirX = Math.Cos(targetAngle);
                        var dirY = Math.Sin(targetAngle);

                        ctx.Db.tank.Id.Update(tank with
                        {
                            BodyRotation = (float)targetAngle,
                            TargetBodyRotation = (float)targetAngle,
                            Velocity = new Vector2Float((float)(dirX * moveSpeed), (float)(dirY * moveSpeed)),
                            BodyAngularVelocity = 0
                        });
                    }
                    else
                    {
                        rotationAmount = Math.Sign(angleDiff) * rotationAmount;
                        ctx.Db.tank.Id.Update(tank with
                        {
                            BodyRotation = (float)(tank.BodyRotation + rotationAmount),
                            TargetBodyRotation = (float)targetAngle,
                            Velocity = new Vector2Float(0, 0),
                            BodyAngularVelocity = (float)(Math.Sign(angleDiff) * tank.BodyRotationSpeed)
                        });
                    }
                }

            }

            if (tank.Target != null)
            {
                var targetTank = ctx.Db.tank.Id.Find(tank.Target);
                if (targetTank != null)
                {
                    var deltaX = targetTank.Value.PositionX - tank.PositionX;
                    var deltaY = targetTank.Value.PositionY - tank.PositionY;
                    var targetAngle = Math.Atan2(deltaY, deltaX);
                    
                    tank = tank with
                    {
                        TargetTurretRotation = (float)targetAngle
                    };
                    ctx.Db.tank.Id.Update(tank);
                }
            }

            if (Math.Abs(tank.TurretRotation - tank.TargetTurretRotation) > 0.001)
            {
                var angleDiff = tank.TargetTurretRotation - tank.TurretRotation;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                var rotationAmount = tank.TurretRotationSpeed * deltaTime;

                if (tank.TurretAngularVelocity == 0)
                {
                    ctx.Db.tank.Id.Update(tank with
                    {
                        TurretAngularVelocity = (float)(Math.Sign(angleDiff) * tank.TurretRotationSpeed)
                    });
                }
                else if (Math.Abs(angleDiff) <= rotationAmount)
                {
                    ctx.Db.tank.Id.Update(tank with
                    {
                        TurretRotation = tank.TargetTurretRotation,
                        TurretAngularVelocity = 0
                    });
                }
                else
                {
                    rotationAmount = Math.Sign(angleDiff) * rotationAmount;
                    ctx.Db.tank.Id.Update(tank with
                    {
                        TurretRotation = (float)(tank.TurretRotation + rotationAmount),
                        TurretAngularVelocity = (float)(Math.Sign(angleDiff) * tank.TurretRotationSpeed)
                    });
                }
            }
        }
    }

    private static bool IsTankFacingTarget(Module.Tank tank, Vector2 target, double tolerance = 0.02)
    {
        var deltaX = target.X - tank.PositionX;
        var deltaY = target.Y - tank.PositionY;
        var targetAngle = Math.Atan2(deltaY, deltaX);

        var angleDiff = targetAngle - tank.BodyRotation;

        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        return Math.Abs(angleDiff) < tolerance;
    }

}
