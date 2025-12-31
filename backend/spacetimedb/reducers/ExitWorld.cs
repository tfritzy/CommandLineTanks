using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void exitWorld(ReducerContext ctx, string joinCode)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var identityString = ctx.Sender.ToString().ToLower();
        var playerTanks = ctx.Db.tank.Owner.Filter(ctx.Sender).ToList();
        
        var homeworldTank = playerTanks.FirstOrDefault(t => t.WorldId == identityString);
        if (homeworldTank.Id != null)
        {
            var updatedTank = homeworldTank with { JoinCode = joinCode };
            ctx.Db.tank.Id.Update(updatedTank);
            Log.Info($"Player {player.Value.Name} already in homeworld, updated join code");
            return;
        }

        var currentTank = playerTanks.FirstOrDefault(t => t.JoinCode == joinCode);
        if (currentTank.Id == null)
        {
            currentTank = playerTanks.OrderByDescending(t => t.UpdatedAt).FirstOrDefault();
        }

        if (currentTank.Id != null)
        {
            RemoveTankFromWorld(ctx, currentTank);
        }

        var tank = ReturnToHomeworld(ctx, ctx.Sender, joinCode);
        if (tank != null)
        {
            AddTankToWorld(ctx, tank.Value);
            Log.Info($"Player {player.Value.Name} returned to homeworld");
        }
    }
}
