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

        var newTargetCode = AllocateTargetCode(ctx, worldId) ?? tank.TargetCode;

        var respawnedTank = tank with
        {
            Alliance = alliance,
            TargetCode = newTargetCode,
            Health = TANK_HEALTH,
            MaxHealth = TANK_HEALTH,
            Kills = resetKills ? 0 : tank.Kills,
            Deaths = resetKills ? 0 : tank.Deaths,
            KillStreak = 0,
            PositionX = spawnX,
            PositionY = spawnY,
            Velocity = new Vector2Float(0, 0),
            TurretAngularVelocity = 0,
            Target = null,
            TargetLead = 0.0f,
            Message = null,
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
            DeathTimestamp = 0,
            UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        return respawnedTank;
    }

    public static Tank BuildTank(
        ReducerContext ctx,
        string? id = null,
        string? worldId = null,
        Identity? owner = null,
        string? name = null,
        string? targetCode = null,
        string? joinCode = null,
        bool? isBot = null,
        AIBehavior aiBehavior = AIBehavior.None,
        AiConfig? aiConfig = null,
        int alliance = 0,
        int health = TANK_HEALTH,
        int maxHealth = TANK_HEALTH,
        int kills = 0,
        int deaths = 0,
        int killStreak = 0,
        int collisionRegionX = 0,
        int collisionRegionY = 0,
        string? target = null,
        float targetLead = 0.0f,
        string? message = null,
        float topSpeed = 3f,
        float turretRotationSpeed = 12f,
        float positionX = 0,
        float positionY = 0,
        Vector2Float? velocity = null,
        float turretAngularVelocity = 0,
        float turretRotation = 0.0f,
        float targetTurretRotation = 0.0f,
        Gun[]? guns = null,
        int selectedGunIndex = 0,
        long remainingSmokescreenCooldownMicros = 0,
        bool hasShield = false,
        long remainingOverdriveCooldownMicros = 0,
        long remainingOverdriveDurationMicros = 0,
        long remainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
        long remainingRepairCooldownMicros = 0,
        bool isRepairing = false,
        ulong repairStartedAt = 0,
        ulong deathTimestamp = 0,
        ulong? updatedAt = null)
    {
        var timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var computedIsBot = isBot ?? (aiBehavior != AIBehavior.None);
        
        return new Tank
        {
            Id = id ?? GenerateId(ctx, "tnk"),
            WorldId = worldId ?? "",
            Owner = owner ?? Identity.From(new byte[32]),
            Name = name ?? "",
            TargetCode = targetCode ?? "",
            JoinCode = joinCode,
            IsBot = computedIsBot,
            AIBehavior = aiBehavior,
            AiConfig = aiConfig,
            Alliance = alliance,
            Health = health,
            MaxHealth = maxHealth,
            Kills = kills,
            Deaths = deaths,
            KillStreak = killStreak,
            CollisionRegionX = collisionRegionX,
            CollisionRegionY = collisionRegionY,
            Target = target,
            TargetLead = targetLead,
            Message = message,
            PositionX = positionX,
            PositionY = positionY,
            TurretRotation = turretRotation,
            TargetTurretRotation = targetTurretRotation,
            TopSpeed = topSpeed,
            TurretRotationSpeed = turretRotationSpeed,
            Guns = guns ?? [BASE_GUN],
            SelectedGunIndex = selectedGunIndex,
            RemainingSmokescreenCooldownMicros = remainingSmokescreenCooldownMicros,
            HasShield = hasShield,
            Velocity = velocity ?? new Vector2Float(0, 0),
            TurretAngularVelocity = turretAngularVelocity,
            RemainingOverdriveCooldownMicros = remainingOverdriveCooldownMicros,
            RemainingOverdriveDurationMicros = remainingOverdriveDurationMicros,
            RemainingImmunityMicros = remainingImmunityMicros,
            RemainingRepairCooldownMicros = remainingRepairCooldownMicros,
            IsRepairing = isRepairing,
            RepairStartedAt = repairStartedAt,
            DeathTimestamp = deathTimestamp,
            UpdatedAt = updatedAt ?? timestamp
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

        var targetCode = AllocateTargetCode(ctx, worldId);
        if (targetCode == null)
        {
            Log.Error($"No available target codes in world {world.Value.Name}");
            return null;
        }

        var player = ctx.Db.player.Identity.Find(owner);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        int assignedAlliance = GetBalancedAlliance(ctx, worldId);
        var (spawnX, spawnY) = FindSpawnPosition(ctx, world.Value, assignedAlliance, ctx.Rng);

        var tank = BuildTank(
            ctx: ctx,
            worldId: worldId,
            owner: owner,
            name: playerName,
            targetCode: targetCode,
            joinCode: joinCode,
            alliance: assignedAlliance,
            positionX: spawnX,
            positionY: spawnY,
            aiBehavior: AIBehavior.None);
        return tank;
    }
}
