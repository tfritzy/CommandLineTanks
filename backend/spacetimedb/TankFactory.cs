using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int MAX_SPAWN_ATTEMPTS = 100;
    private const int SPAWN_ZONE_WIDTH = 5;

    public static Tank RespawnTank(ReducerContext ctx, Tank tank, string worldId, int alliance, bool resetKills = false, (float, float)? spawnPosition = null)
    {
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (traversibilityMap == null)
        {
            return tank;
        }

        var (spawnX, spawnY) = spawnPosition ?? FindSpawnPosition(ctx, traversibilityMap.Value, alliance, ctx.Rng);

        var respawnedTank = tank with
        {
            Alliance = alliance,
            Health = TANK_HEALTH,
            MaxHealth = TANK_HEALTH,
            Kills = resetKills ? 0 : tank.Kills,
            Deaths = resetKills ? 0 : tank.Deaths,
            PositionX = spawnX,
            PositionY = spawnY,
            Velocity = new Vector2Float(0, 0),
            TurretAngularVelocity = 0,
            Target = null,
            TargetLead = 0.0f,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0,
            HasShield = false,
            RemainingSmokescreenCooldownMicros = 0,
            RemainingOverdriveCooldownMicros = 0,
            RemainingOverdriveDurationMicros = 0,
            RemainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
            RemainingRepairCooldownMicros = 0,
            IsRepairing = false,
            RepairStartedAt = 0,
            UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        return respawnedTank;
    }

    private static Tank BuildTank(ReducerContext ctx, string worldId, Identity owner, string name, string joinCode, int alliance, float positionX, float positionY, AIBehavior aiBehavior = AIBehavior.None)
    {
        var tankId = GenerateId(ctx, "tnk");
        return new Tank
        {
            Id = tankId,
            WorldId = worldId,
            Owner = owner,
            Name = name,
            JoinCode = joinCode,
            IsBot = aiBehavior != AIBehavior.None,
            AIBehavior = aiBehavior,
            Alliance = alliance,
            Health = TANK_HEALTH,
            MaxHealth = TANK_HEALTH,
            Kills = 0,
            Deaths = 0,
            CollisionRegionX = 0,
            CollisionRegionY = 0,
            Target = null,
            TargetLead = 0.0f,
            PositionX = positionX,
            PositionY = positionY,
            TurretRotation = 0.0f,
            TargetTurretRotation = 0.0f,
            TopSpeed = 3f,
            TurretRotationSpeed = 12f,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0,
            RemainingSmokescreenCooldownMicros = 0,
            HasShield = false,
            Velocity = new Vector2Float(0, 0),
            TurretAngularVelocity = 0,
            RemainingOverdriveCooldownMicros = 0,
            RemainingOverdriveDurationMicros = 0,
            RemainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
            RemainingRepairCooldownMicros = 0,
            IsRepairing = false,
            RepairStartedAt = 0,
            UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
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

        int minX, maxX, minY, maxY;

        if (alliance == 0)
        {
            minX = 0;
            maxX = SPAWN_ZONE_WIDTH;
        }
        else if (alliance == 1)
        {
            minX = worldWidth - SPAWN_ZONE_WIDTH;
            maxX = worldWidth;
        }
        else
        {
            minX = 0;
            maxX = SPAWN_ZONE_WIDTH;
        }

        minY = 0;
        maxY = worldHeight;

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

    public static int GetBalancedAlliance(ReducerContext ctx, string worldId)
    {
        int alliance0Count = 0;
        int alliance1Count = 0;
        foreach (var t in ctx.Db.tank.WorldId.Filter(worldId))
        {
            if (t.Alliance == 0)
            {
                alliance0Count++;
            }
            else if (t.Alliance == 1)
            {
                alliance1Count++;
            }
        }

        return alliance0Count <= alliance1Count ? 0 : 1;
    }

    public static Tank? CreateTankInWorld(ReducerContext ctx, string worldId, Identity owner, string joinCode)
    {
        Tank existingTank = ctx.Db.tank.Owner.Filter(owner).Where(t => t.WorldId == worldId).FirstOrDefault();
        if (!string.IsNullOrEmpty(existingTank.Id))
        {
            Log.Info("Player already has tank in world");
            return null;
        }

        var world = ctx.Db.world.Id.Find(worldId);
        if (world == null)
        {
            Log.Error($"World {worldId} not found");
            return null;
        }

        var tankName = AllocateTankName(ctx, worldId);
        if (tankName == null)
        {
            Log.Error($"No available tank names in world {world.Value.Name}");
            return null;
        }

        int assignedAlliance = GetBalancedAlliance(ctx, worldId);
        var (spawnX, spawnY) = FindSpawnPosition(ctx, world.Value, assignedAlliance, ctx.Rng);

        var tank = BuildTank(ctx, worldId, owner, tankName, joinCode, assignedAlliance, spawnX, spawnY, AIBehavior.None);
        return tank;
    }
}
