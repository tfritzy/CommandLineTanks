using SpacetimeDB;
using static Types;

public static partial class SpiderMineUpdater
{
    private const float SPIDER_MINE_DETECTION_RADIUS = 2.0f;
    private const float SPIDER_MINE_SPEED = 3.0f;
    public const int SPIDER_MINE_HEALTH = 1;

    [Table(Scheduled = nameof(UpdateSpiderMines))]
    public partial struct ScheduledSpiderMineUpdates
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
        public ulong LastTickAt;
    }

    [Reducer]
    public static void UpdateSpiderMines(ReducerContext ctx, ScheduledSpiderMineUpdates args)
    {
        var currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var deltaTimeMicros = currentTime - args.LastTickAt;
        var deltaTime = deltaTimeMicros / 1_000_000.0;

        ctx.Db.ScheduledSpiderMineUpdates.ScheduledId.Update(args with
        {
            LastTickAt = currentTime
        });

        foreach (var iMine in ctx.Db.spider_mine.WorldId.Filter(args.WorldId))
        {
            var mine = iMine;
            bool needsUpdate = false;

            if (mine.IsPlanted)
            {
                Module.Tank? targetTank = null;

                if (mine.TargetTankId != null)
                {
                    targetTank = ctx.Db.tank.Id.Find(mine.TargetTankId);
                    if (targetTank == null || targetTank.Value.Health <= 0)
                    {
                        mine = mine with { TargetTankId = null };
                        needsUpdate = true;
                    }
                }

                if (mine.TargetTankId == null)
                {
                    targetTank = FindNearestEnemyTank(ctx, mine, args.WorldId);
                    if (targetTank != null)
                    {
                        mine = mine with { TargetTankId = targetTank.Value.Id };
                        needsUpdate = true;
                    }
                }

                if (mine.TargetTankId != null && targetTank != null)
                {
                    var deltaX = targetTank.Value.PositionX - mine.PositionX;
                    var deltaY = targetTank.Value.PositionY - mine.PositionY;
                    var distance = Math.Sqrt(deltaX * deltaX + deltaY * deltaY);

                    if (distance <= Module.TANK_COLLISION_RADIUS + 0.5f)
                    {
                        HandleTankDamage(ctx, targetTank.Value, mine, args.WorldId);
                        ctx.Db.spider_mine.Id.Delete(mine.Id);
                        continue;
                    }

                    if (distance > 0)
                    {
                        var dirX = deltaX / distance;
                        var dirY = deltaY / distance;
                        var moveDistance = SPIDER_MINE_SPEED * deltaTime;

                        mine = mine with
                        {
                            PositionX = (float)(mine.PositionX + dirX * moveDistance),
                            PositionY = (float)(mine.PositionY + dirY * moveDistance),
                            Velocity = new Vector2Float((float)(dirX * SPIDER_MINE_SPEED), (float)(dirY * SPIDER_MINE_SPEED))
                        };
                        needsUpdate = true;
                    }
                }
                else
                {
                    mine = mine with
                    {
                        Velocity = new Vector2Float(0, 0)
                    };
                    needsUpdate = true;
                }

                int newCollisionRegionX = (int)(mine.PositionX / Module.COLLISION_REGION_SIZE);
                int newCollisionRegionY = (int)(mine.PositionY / Module.COLLISION_REGION_SIZE);

                if (newCollisionRegionX != mine.CollisionRegionX || newCollisionRegionY != mine.CollisionRegionY)
                {
                    mine = mine with
                    {
                        CollisionRegionX = newCollisionRegionX,
                        CollisionRegionY = newCollisionRegionY
                    };
                    needsUpdate = true;
                }
            }

            if (needsUpdate)
            {
                ctx.Db.spider_mine.Id.Update(mine);
            }
        }
    }

    private static Module.Tank? FindNearestEnemyTank(ReducerContext ctx, Module.SpiderMine mine, string worldId)
    {
        int mineCollisionRegionX = (int)(mine.PositionX / Module.COLLISION_REGION_SIZE);
        int mineCollisionRegionY = (int)(mine.PositionY / Module.COLLISION_REGION_SIZE);

        int searchRadius = (int)Math.Ceiling(SPIDER_MINE_DETECTION_RADIUS / Module.COLLISION_REGION_SIZE);

        Module.Tank? closestTarget = null;
        float closestDistanceSquared = SPIDER_MINE_DETECTION_RADIUS * SPIDER_MINE_DETECTION_RADIUS;

        for (int deltaX = -searchRadius; deltaX <= searchRadius; deltaX++)
        {
            for (int deltaY = -searchRadius; deltaY <= searchRadius; deltaY++)
            {
                int regionX = mineCollisionRegionX + deltaX;
                int regionY = mineCollisionRegionY + deltaY;

                foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((worldId, regionX, regionY)))
                {
                    if (tank.Alliance != mine.Alliance && tank.Health > 0)
                    {
                        var dx_tank = tank.PositionX - mine.PositionX;
                        var dy_tank = tank.PositionY - mine.PositionY;
                        var distanceSquared = dx_tank * dx_tank + dy_tank * dy_tank;

                        if (distanceSquared < closestDistanceSquared)
                        {
                            closestDistanceSquared = distanceSquared;
                            closestTarget = tank;
                        }
                    }
                }
            }
        }

        return closestTarget;
    }

    private static void HandleTankDamage(ReducerContext ctx, Module.Tank tank, Module.SpiderMine mine, string worldId)
    {
        var newHealth = tank.Health - 50;
        var updatedTank = tank with
        {
            Health = newHealth
        };
        ctx.Db.tank.Id.Update(updatedTank);

        if (newHealth <= 0)
        {
            var killedTank = tank with
            {
                Deaths = tank.Deaths + 1
            };
            ctx.Db.tank.Id.Update(killedTank);

            var shooterTank = ctx.Db.tank.Id.Find(mine.ShooterTankId);
            if (shooterTank != null)
            {
                var updatedShooterTank = shooterTank.Value with
                {
                    Kills = shooterTank.Value.Kills + 1
                };
                ctx.Db.tank.Id.Update(updatedShooterTank);

                var killeeName = tank.IsBot ? $"[Bot] {tank.Name}" : tank.Name;
                ctx.Db.kills.Insert(new Module.Kill
                {
                    Id = Module.GenerateId(ctx, "k"),
                    WorldId = worldId,
                    Killer = shooterTank.Value.Owner,
                    KilleeName = killeeName,
                    Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
                });
            }

            var score = ctx.Db.score.WorldId.Find(worldId);
            if (score != null)
            {
                var updatedScore = score.Value;
                if (mine.Alliance >= 0 && mine.Alliance < updatedScore.Kills.Length)
                {
                    updatedScore.Kills[mine.Alliance]++;
                    ctx.Db.score.WorldId.Update(updatedScore);
                }
            }
        }
    }

    public static void InitializeSpiderMineUpdater(ReducerContext ctx, string worldId)
    {
        ctx.Db.ScheduledSpiderMineUpdates.Insert(new ScheduledSpiderMineUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = Module.NETWORK_TICK_RATE_MICROS }),
            WorldId = worldId,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });
    }
}
