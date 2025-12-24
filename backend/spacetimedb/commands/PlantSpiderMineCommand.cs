using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void PlantSpiderMineCommand(ReducerContext ctx, Projectile projectile, string worldId)
    {
        var mineId = GenerateId(ctx, "spm");
        var mine = new SpiderMine
        {
            Id = mineId,
            WorldId = worldId,
            ShooterTankId = projectile.ShooterTankId,
            Alliance = projectile.Alliance,
            PositionX = projectile.PositionX,
            PositionY = projectile.PositionY,
            CollisionRegionX = (int)(projectile.PositionX / COLLISION_REGION_SIZE),
            CollisionRegionY = (int)(projectile.PositionY / COLLISION_REGION_SIZE),
            Health = SpiderMineUpdater.SPIDER_MINE_HEALTH,
            TargetTankId = null,
            IsPlanted = true,
            PlantingStartedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Velocity = new Vector2Float(0, 0)
        };

        ctx.Db.spider_mine.Insert(mine);
        Log.Info($"Spider mine planted at ({mine.PositionX}, {mine.PositionY})");
    }
}
