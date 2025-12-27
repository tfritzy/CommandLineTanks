using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void findWorld(ReducerContext ctx, string joinCode)
    {
        Log.Info(ctx.Sender + " is looking for a game");

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        World? world = ctx.Db.world.GameState_IsHomeWorld.Filter((GameState.Playing, false)).FirstOrDefault();

        if (world == null)
        {
            Log.Error("No worlds available");
            return;
        }

        Tank existingTank = ctx.Db.tank.Owner.Filter(ctx.Sender).Where(t => t.WorldId == world?.Id).FirstOrDefault();
        if (!string.IsNullOrEmpty(existingTank.Id))
        {
            Log.Info("Player already had tank in world, so updated its join code");
            existingTank.JoinCode = joinCode;
            ctx.Db.tank.Id.Update(existingTank);
            return;
        }

        var identityString = ctx.Sender.ToString().ToLower();
        var homeworldTanks = ctx.Db.tank.WorldId.Filter(identityString).Where(t => t.Owner == ctx.Sender);
        foreach (var homeworldTank in homeworldTanks)
        {
            ctx.Db.tank.Id.Delete(homeworldTank.Id);
            Log.Info($"Deleted homeworld tank {homeworldTank.Id} for player {player.Value.Name}");
        }

        if (!HasAnyTanksInWorld(ctx, identityString))
        {
            StopWorldTickers(ctx, identityString);
        }

        var tank = CreateTankInWorld(ctx, world.Value.Id, ctx.Sender, joinCode);
        if (tank != null)
        {
            ctx.Db.tank.Insert(tank.Value);
            Log.Info($"Player {player.Value.Name} joined world {world.Value.Name} with tank {tank.Value.Id} named {tank.Value.Name} (joinCode: {joinCode})");
        }
    }
}
