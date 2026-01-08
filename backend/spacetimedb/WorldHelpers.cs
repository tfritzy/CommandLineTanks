using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void AddTankToWorld(ReducerContext ctx, Tank tank, TankMetadata metadata, TankPosition position)
    {
        ctx.Db.tank.Insert(tank);
        ctx.Db.tank_metadata.Insert(metadata);
        ctx.Db.tank_position.Insert(position);
        
        if (metadata.IsBot)
        {
            IncrementBotCount(ctx, metadata.WorldId);
        }
        else
        {
            IncrementPlayerCount(ctx, metadata.WorldId);
        }
    }

    public static void RemoveTankFromWorld(ReducerContext ctx, Tank tank, TankMetadata metadata)
    {
        var isBot = metadata.IsBot;
        var worldId = metadata.WorldId;
        
        var fireState = ctx.Db.tank_fire_state.TankId.Find(tank.Id);
        if (fireState != null)
        {
            ctx.Db.tank_fire_state.TankId.Delete(tank.Id);
        }
        
        DeleteTankPathIfExists(ctx, tank.Id);
        
        ctx.Db.tank_position.TankId.Delete(tank.Id);
        ctx.Db.tank_metadata.TankId.Delete(tank.Id);
        ctx.Db.tank.Id.Delete(tank.Id);
        
        if (isBot)
        {
            DecrementBotCount(ctx, worldId);
        }
        else
        {
            DecrementPlayerCount(ctx, worldId);
        }
    }

    public static void IncrementPlayerCount(ReducerContext ctx, string worldId)
    {
        var world = ctx.Db.world.Id.Find(worldId);
        if (world == null) return;

        var updatedWorld = world.Value with
        {
            CurrentPlayerCount = world.Value.CurrentPlayerCount + 1
        };
        ctx.Db.world.Id.Update(updatedWorld);
    }

    public static void DecrementPlayerCount(ReducerContext ctx, string worldId)
    {
        var world = ctx.Db.world.Id.Find(worldId);
        if (world == null) return;

        var updatedWorld = world.Value with
        {
            CurrentPlayerCount = Math.Max(0, world.Value.CurrentPlayerCount - 1)
        };
        ctx.Db.world.Id.Update(updatedWorld);
    }

    public static void IncrementBotCount(ReducerContext ctx, string worldId)
    {
        var world = ctx.Db.world.Id.Find(worldId);
        if (world == null) return;

        var updatedWorld = world.Value with
        {
            BotCount = world.Value.BotCount + 1
        };
        ctx.Db.world.Id.Update(updatedWorld);
    }

    public static void DecrementBotCount(ReducerContext ctx, string worldId)
    {
        var world = ctx.Db.world.Id.Find(worldId);
        if (world == null) return;

        var updatedWorld = world.Value with
        {
            BotCount = Math.Max(0, world.Value.BotCount - 1)
        };
        ctx.Db.world.Id.Update(updatedWorld);
    }

    public static void DeleteHomeworldIfEmpty(ReducerContext ctx, string identityString)
    {
        var homeworld = ctx.Db.world.Id.Find(identityString);
        if (homeworld == null || !homeworld.Value.IsHomeWorld)
        {
            return;
        }

        var hasHumanPlayers = ctx.Db.tank_metadata.WorldId.Filter(identityString).Any(m => !m.IsBot);
        if (hasHumanPlayers)
        {
            return;
        }

        DeleteWorld(ctx, identityString);
        Log.Info($"Deleted empty homeworld for identity {identityString}");
    }

    public static void ReturnToHomeworld(ReducerContext ctx, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var homeworld = ctx.Db.world.Id.Find(identityString);
        if (homeworld == null)
        {
            CreateHomeworld(ctx, identityString);
        }

        var existingMetadata = ctx.Db.tank_metadata.WorldId_Owner.Filter((identityString, ctx.Sender))
            .FirstOrDefault();
        
        if (existingMetadata.TankId != null)
        {
            var updatedMetadata = existingMetadata with { JoinCode = joinCode };
            ctx.Db.tank_metadata.TankId.Update(updatedMetadata);
            StartWorldTickers(ctx, identityString);
            Log.Info($"Updated existing homeworld tank with new join code");
            return;
        }

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var (tank, metadata, position) = BuildTank(
            ctx: ctx,
            worldId: identityString,
            owner: ctx.Sender,
            name: playerName,
            targetCode: "",
            joinCode: joinCode,
            alliance: 0,
            positionX: HOMEWORLD_WIDTH / 2 + .5f,
            positionY: HOMEWORLD_HEIGHT / 2 + .5f,
            aiBehavior: AIBehavior.None);

        AddTankToWorld(ctx, tank, metadata, position);
        StartWorldTickers(ctx, identityString);
        Log.Info($"Created homeworld tank for identity {identityString}");
    }
}
