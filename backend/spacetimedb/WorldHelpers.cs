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

    public static Tank? CreateHomeworldTank(ReducerContext ctx, Identity owner)
    {
        var identityString = owner.ToString().ToLower();
        var homeworld = ctx.Db.world.Id.Find(identityString);
        if (homeworld == null)
        {
            Log.Error($"Homeworld not found for identity {identityString}");
            return null;
        }

        var targetCode = AllocateTargetCode(ctx, identityString);
        if (targetCode == null)
        {
            Log.Error($"No available target codes in homeworld");
            return null;
        }

        var player = ctx.Db.player.Identity.Find(owner);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var tank = BuildTank(
            ctx,
            identityString,
            owner,
            playerName,
            targetCode,
            "",
            0,
            HOMEWORLD_WIDTH / 2 + .5f,
            HOMEWORLD_HEIGHT / 2 + .5f,
            AIBehavior.None);

        StartWorldTickers(ctx, identityString);
        
        return tank;
    }

    public static Tank? ReturnToHomeworld(ReducerContext ctx, Identity owner, string joinCode)
    {
        var identityString = owner.ToString().ToLower();
        var homeworld = ctx.Db.world.Id.Find(identityString);
        if (homeworld == null)
        {
            Log.Error($"Homeworld not found for identity {identityString}");
            return null;
        }

        var existingTank = ctx.Db.tank.WorldId.Filter(identityString)
            .Where(t => t.Owner == owner)
            .FirstOrDefault();
        
        if (existingTank.Id != null)
        {
            var updatedTank = existingTank with { JoinCode = joinCode };
            ctx.Db.tank.Id.Update(updatedTank);
            StartWorldTickers(ctx, identityString);
            Log.Info($"Updated existing homeworld tank with new join code");
            return null;
        }

        var targetCode = AllocateTargetCode(ctx, identityString);
        if (targetCode == null)
        {
            Log.Error($"No available target codes in homeworld");
            return null;
        }

        var player = ctx.Db.player.Identity.Find(owner);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var tank = BuildTank(
            ctx,
            identityString,
            owner,
            playerName,
            targetCode,
            joinCode,
            0,
            HOMEWORLD_WIDTH / 2 + .5f,
            HOMEWORLD_HEIGHT / 2 + .5f,
            AIBehavior.None);

        StartWorldTickers(ctx, identityString);
        
        return tank;
    }
}
