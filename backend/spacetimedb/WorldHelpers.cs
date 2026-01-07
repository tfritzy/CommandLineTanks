using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void AddTankToWorld(ReducerContext ctx, Tank tank)
    {
        ctx.Db.tank.Insert(tank);
        
        if (tank.IsBot)
        {
            IncrementBotCount(ctx, tank.WorldId);
        }
        else
        {
            IncrementPlayerCount(ctx, tank.WorldId);
        }
    }

    public static void RemoveTankFromWorld(ReducerContext ctx, Tank tank)
    {
        var isBot = tank.IsBot;
        var worldId = tank.WorldId;
        
        var fireState = ctx.Db.tank_fire_state.TankId.Find(tank.Id);
        if (fireState != null)
        {
            ctx.Db.tank_fire_state.TankId.Delete(tank.Id);
        }
        
        DeleteTankPathIfExists(ctx, tank.Id);
        
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

    public static void ReturnToHomeworld(ReducerContext ctx, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToUpper();
        var homeworld = ctx.Db.world.Id.Find(identityString);
        if (homeworld == null)
        {
            Log.Error($"Homeworld not found for identity {identityString}");
            return;
        }

        var existingTank = ctx.Db.tank.WorldId.Filter(identityString)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();
        
        if (existingTank.Id != null)
        {
            var updatedTank = existingTank with { JoinCode = joinCode };
            ctx.Db.tank.Id.Update(updatedTank);
            StartWorldTickers(ctx, identityString);
            Log.Info($"Updated existing homeworld tank with new join code");
            return;
        }

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var tank = Tank.Build(
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

        AddTankToWorld(ctx, tank);
        StartWorldTickers(ctx, identityString);
        Log.Info($"Created homeworld tank for identity {identityString}");
    }
}
