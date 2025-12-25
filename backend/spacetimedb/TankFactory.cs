using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const float SPAWN_PADDING_RATIO = 0.25f;
    private const int MAX_SPAWN_ATTEMPTS = 100;

    public static Tank RespawnTank(ReducerContext ctx, Tank tank, string worldId, int alliance, bool resetKills = false)
    {
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (traversibilityMap == null)
        {
            return tank;
        }

        var (spawnX, spawnY) = FindSpawnPosition(ctx, traversibilityMap.Value, alliance, ctx.Rng);

        var respawnedTank = tank with
        {
            Alliance = alliance,
            Health = TANK_HEALTH,
            MaxHealth = TANK_HEALTH,
            Kills = resetKills ? 0 : tank.Kills,
            Deaths = resetKills ? 0 : tank.Deaths,
            PositionX = spawnX,
            PositionY = spawnY,
            Path = [],
            Velocity = new Vector2Float(0, 0),
            TurretAngularVelocity = 0,
            Target = null,
            TargetLead = 0.0f,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0,
            LastFireTime = 0,
            HasShield = false
        };

        return respawnedTank;
    }

    private static Tank BuildTank(ReducerContext ctx, string worldId, Identity owner, string name, string joinCode, int alliance, float positionX, float positionY, bool isBot = false)
    {
        var tankId = GenerateId(ctx, "tnk");
        return new Tank
        {
            Id = tankId,
            WorldId = worldId,
            Owner = owner,
            Name = name,
            JoinCode = joinCode,
            IsBot = isBot,
            Alliance = alliance,
            Health = TANK_HEALTH,
            MaxHealth = TANK_HEALTH,
            Kills = 0,
            Deaths = 0,
            CollisionRegionX = 0,
            CollisionRegionY = 0,
            Target = null,
            TargetLead = 0.0f,
            Path = [],
            PositionX = positionX,
            PositionY = positionY,
            TurretRotation = 0.0f,
            TargetTurretRotation = 0.0f,
            TopSpeed = 3f,
            TurretRotationSpeed = 12f,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0,
            LastFireTime = 0,
            SmokescreenCooldownEnd = 0,
            HasShield = false,
            Velocity = new Vector2Float(0, 0),
            TurretAngularVelocity = 0
        };
    }

    public static (float, float) FindSpawnPosition(ReducerContext ctx, World world, int alliance, Random random)
    {
        var traversibilityMapQuery = ctx.Db.traversibility_map.WorldId.Find(world.Id);
        if (traversibilityMapQuery == null) return (0, 0);
        return FindSpawnPosition(ctx, traversibilityMapQuery.Value, alliance, random);
    }

    public static (float, float) FindSpawnPosition(ReducerContext ctx, TraversibilityMap traversibilityMap, int alliance, Random random)
    {
        int worldWidth = traversibilityMap.Width;
        int worldHeight = traversibilityMap.Height;

        int halfWidth = worldWidth / 2;
        int paddingX = (int)(halfWidth * SPAWN_PADDING_RATIO);
        int paddingY = (int)(worldHeight * SPAWN_PADDING_RATIO);

        int minX, maxX, minY, maxY;

        if (alliance == 0)
        {
            minX = paddingX;
            maxX = halfWidth - paddingX;
        }
        else if (alliance == 1)
        {
            minX = halfWidth + paddingX;
            maxX = worldWidth - paddingX;
        }
        else
        {
            minX = paddingX;
            maxX = halfWidth - paddingX;
        }

        minY = paddingY;
        maxY = worldHeight - paddingY;

        for (int attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++)
        {
            int x = minX;
            int y = minY;

            if (maxX > minX)
            {
                x = minX + random.Next(maxX - minX);
            }

            if (maxY > minY)
            {
                y = minY + random.Next(maxY - minY);
            }

            int index = y * worldWidth + x;
            if (index < traversibilityMap.Map.Length && traversibilityMap.Map[index])
            {
                return (x + 0.5f, y + 0.5f);
            }
        }

        float centerX = (minX + maxX) / 2.0f + 0.5f;
        float centerY = (minY + maxY) / 2.0f + 0.5f;
        return (centerX, centerY);
    }
}
