using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void AddTankToWorld(ReducerContext ctx, Tank tank, TankTransform transform)
    {
        ctx.Db.tank.Insert(tank);
        ctx.Db.tank_transform.Insert(transform);
        
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
        
        ctx.Db.tank_transform.TankId.Delete(tank.Id);
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

        var hasHumanPlayers = ctx.Db.tank.WorldId.Filter(identityString).Any(t => !t.IsBot);
        if (hasHumanPlayers)
        {
            return;
        }

        DeleteWorld(ctx, identityString);
        Log.Info($"Deleted empty homeworld for identity {identityString}");
    }

    public static void EnsureTankInHomeworld(ReducerContext ctx, string identityString, string joinCode)
    {
        var existingTank = ctx.Db.tank.WorldId_Owner.Filter((identityString, ctx.Sender))
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

        var (tank, transform) = BuildTank(
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

        AddTankToWorld(ctx, tank, transform);
        StartWorldTickers(ctx, identityString);
        Log.Info($"Created homeworld tank for identity {identityString}");
    }

    public static void ReturnToHomeworld(ReducerContext ctx, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var homeworld = ctx.Db.world.Id.Find(identityString);
        if (homeworld == null)
        {
            CreateHomeworld(ctx, identityString);
        }

        EnsureTankInHomeworld(ctx, identityString, joinCode);
    }

    public static Tank TargetTankByCode(ReducerContext ctx, Tank tank, string targetCode)
    {
        if (tank.Health <= 0) return tank;

        var targetCodeLower = targetCode.ToLower();
        var targetTank = ctx.Db.tank.WorldId_TargetCode.Filter((tank.WorldId, targetCodeLower)).FirstOrDefault();

        if (targetTank.Id == null)
        {
            return tank;
        }

        return tank with
        {
            Target = targetTank.Id,
            TargetLead = 0
        };
    }
}
