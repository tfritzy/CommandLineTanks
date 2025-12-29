using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void joinWorld(ReducerContext ctx, string worldId)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var tank = CreateTankInWorld(ctx, worldId, ctx.Sender, "");
        if (tank != null)
        {
            ctx.Db.tank.Insert(tank.Value);
            Log.Info($"Player {player.Value.Name} joined world {worldId} with tank {tank.Value.Id} named {tank.Value.Name}");
        }
    }

    [Reducer]
    public static void joinWorldWithPasscode(ReducerContext ctx, string worldId, string joinCode, string? passcode)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var world = ctx.Db.world.Id.Find(worldId);
        if (world == null)
        {
            Log.Error($"World {worldId} not found");
            return;
        }

        if (world.Value.IsPrivate && world.Value.Passcode != passcode)
        {
            Log.Error($"Invalid passcode for private world {worldId}");
            return;
        }

        var identityString = ctx.Sender.ToString().ToLower();
        var homeworldTanks = ctx.Db.tank.WorldId.Filter(identityString).Where(t => t.Owner == ctx.Sender);
        foreach (var homeworldTank in homeworldTanks)
        {
            var fireState = ctx.Db.tank_fire_state.TankId.Find(homeworldTank.Id);
            if (fireState != null)
            {
                ctx.Db.tank_fire_state.TankId.Delete(homeworldTank.Id);
            }
            ctx.Db.tank.Id.Delete(homeworldTank.Id);
            Log.Info($"Deleted homeworld tank {homeworldTank.Id} for player {player.Value.Name}");
        }

        if (!HasAnyTanksInWorld(ctx, identityString))
        {
            StopWorldTickers(ctx, identityString);
        }

        Tank existingTank = ctx.Db.tank.Owner.Filter(ctx.Sender).Where(t => t.WorldId == worldId).FirstOrDefault();
        if (!string.IsNullOrEmpty(existingTank.Id))
        {
            Log.Info("Player already had tank in world, so updated its join code");
            existingTank.JoinCode = joinCode;
            ctx.Db.tank.Id.Update(existingTank);
            return;
        }

        var tank = CreateTankInWorld(ctx, worldId, ctx.Sender, joinCode);
        if (tank != null)
        {
            ctx.Db.tank.Insert(tank.Value);
            Log.Info($"Player {player.Value.Name} joined world {worldId} with tank {tank.Value.Id} named {tank.Value.Name} (joinCode: {joinCode})");
        }
    }
}
