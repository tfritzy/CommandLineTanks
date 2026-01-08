using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int MAX_SPAWN_ATTEMPTS = 100;
    private const int SPAWN_ZONE_WIDTH = 5;

    public static void RespawnTank(ReducerContext ctx, Tank tank, TankMetadata metadata, TankPosition position, string worldId, int alliance, bool resetKills = false, (float, float)? spawnPosition = null)
    {
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (traversibilityMap == null)
        {
            return;
        }

        var (spawnX, spawnY) = spawnPosition ?? FindSpawnPosition(ctx, traversibilityMap.Value, alliance, ctx.Rng);

        var newTargetCode = AllocateTargetCode(ctx, worldId) ?? metadata.TargetCode;

        var respawnedTank = tank with
        {
            Health = metadata.MaxHealth,
            Kills = resetKills ? 0 : tank.Kills,
            Deaths = resetKills ? 0 : tank.Deaths,
            KillStreak = 0,
            TurretAngularVelocity = 0,
            Target = null,
            TargetLead = 0.0f,
            Message = null,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0,
            HasShield = false,
            RemainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
            DeathTimestamp = 0
        };

        var respawnedMetadata = metadata with
        {
            Alliance = alliance,
            TargetCode = newTargetCode
        };

        var respawnedPosition = position with
        {
            PositionX = spawnX,
            PositionY = spawnY,
            Velocity = new Vector2Float(0, 0),
            UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        ctx.Db.tank.Id.Update(respawnedTank);
        ctx.Db.tank_metadata.TankId.Update(respawnedMetadata);
        ctx.Db.tank_position.TankId.Update(respawnedPosition);
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
        foreach (var m in ctx.Db.tank_metadata.WorldId.Filter(worldId))
        {
            if (m.Alliance == 0)
            {
                alliance0Count++;
            }
            else if (m.Alliance == 1)
            {
                alliance1Count++;
            }
        }

        return alliance0Count <= alliance1Count ? 0 : 1;
    }

    public static (Tank, TankMetadata, TankPosition)? CreateTankInWorld(ReducerContext ctx, string worldId, Identity owner, string joinCode)
    {
        TankMetadata? existingMetadata = ctx.Db.tank_metadata.WorldId_Owner.Filter((worldId, owner)).FirstOrDefault();
        if (existingMetadata != null && !string.IsNullOrEmpty(existingMetadata.Value.TankId))
        {
            Log.Info($"Player already has tank in world {worldId}, removing before creating new one");
            var existingTank = ctx.Db.tank.Id.Find(existingMetadata.Value.TankId);
            if (existingTank != null)
            {
                RemoveTankFromWorld(ctx, existingTank.Value, existingMetadata.Value);
            }
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

        var (tank, metadata, position) = BuildTank(
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
        return (tank, metadata, position);
    }
}
