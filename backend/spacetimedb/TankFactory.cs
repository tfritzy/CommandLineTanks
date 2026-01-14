using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int MAX_SPAWN_ATTEMPTS = 100;
    private const int SPAWN_ZONE_WIDTH = 5;

    public static void RespawnTank(ReducerContext ctx, Tank tank, TankTransform transform, string gameId, int alliance, bool resetKills = false, (float, float)? spawnPosition = null)
    {
        var traversibilityMap = ctx.Db.traversibility_map.GameId.Find(gameId);
        if (traversibilityMap == null)
        {
            return;
        }

        var (spawnX, spawnY) = spawnPosition ?? FindSpawnPosition(ctx, traversibilityMap.Value, alliance, ctx.Rng);

        var newTargetCode = AllocateTargetCode(ctx, gameId) ?? tank.TargetCode;

        var respawnedTank = tank with
        {
            Health = tank.MaxHealth,
            Kills = resetKills ? 0 : tank.Kills,
            Deaths = resetKills ? 0 : tank.Deaths,
            KillStreak = 0,
            Target = null,
            TargetLead = 0.0f,
            Message = null,
            SelectedGunIndex = 0,
            HasShield = false,
            RemainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
            DeathTimestamp = 0,
            Alliance = alliance,
            TargetCode = newTargetCode
        };

        var respawnedTransform = transform with
        {
            PositionX = spawnX,
            PositionY = spawnY,
            Velocity = new Vector2Float(0, 0),
            TurretRotation = 0,
            TargetTurretRotation = 0,
            TurretAngularVelocity = 0,
            UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        ctx.Db.tank.Id.Update(respawnedTank);
        ctx.Db.tank_transform.TankId.Update(respawnedTransform);
    }

    public static (float, float) FindSpawnPosition(ReducerContext ctx, Game game, int alliance, Random random)
    {
        var traversibilityMapQuery = ctx.Db.traversibility_map.GameId.Find(game.Id);
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
            if (index < traversibilityMap.Map.Length * 8 && traversibilityMap.IsTraversable(index))
            {
                return (x + 0.5f, y + 0.5f);
            }
        }

        float centerX = (minX + maxX) / 2.0f + 0.5f;
        float centerY = (minY + maxY) / 2.0f + 0.5f;
        return (centerX, centerY);
    }

    public static int GetBalancedAlliance(ReducerContext ctx, string gameId)
    {
        int alliance0Count = 0;
        int alliance1Count = 0;
        foreach (var t in ctx.Db.tank.GameId.Filter(gameId))
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

    public static (Tank, TankTransform)? CreateTankInGame(ReducerContext ctx, string gameId, Identity owner, string joinCode)
    {
        Tank? existingTank = ctx.Db.tank.GameId_Owner.Filter((gameId, owner)).FirstOrDefault();
        if (existingTank != null && !string.IsNullOrEmpty(existingTank.Value.Id))
        {
            Log.Info($"Player already has tank in game {gameId}, removing before creating new one");
            RemoveTankFromGame(ctx, existingTank.Value);
        }

        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null)
        {
            Log.Error($"Game {gameId} not found");
            return null;
        }

        var targetCode = AllocateTargetCode(ctx, gameId);
        if (targetCode == null)
        {
            Log.Error($"No available target codes in game {gameId}");
            return null;
        }

        var player = ctx.Db.player.Identity.Find(owner);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        int assignedAlliance = GetBalancedAlliance(ctx, gameId);
        var (spawnX, spawnY) = FindSpawnPosition(ctx, game.Value, assignedAlliance, ctx.Rng);

        var (tank, transform) = BuildTank(
            ctx: ctx,
            gameId: gameId,
            owner: owner,
            name: playerName,
            targetCode: targetCode,
            joinCode: joinCode,
            alliance: assignedAlliance,
            positionX: spawnX,
            positionY: spawnY,
            aiBehavior: AIBehavior.None);
        return (tank, transform);
    }
}
