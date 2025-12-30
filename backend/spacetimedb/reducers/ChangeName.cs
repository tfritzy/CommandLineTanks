using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void changeName(ReducerContext ctx, string newName)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        if (string.IsNullOrWhiteSpace(newName))
        {
            Log.Error("Invalid name: name cannot be empty or whitespace");
            return;
        }

        if (newName.Length > 50)
        {
            Log.Error("Invalid name: name cannot exceed 50 characters");
            return;
        }

        var updatedPlayer = player.Value;
        updatedPlayer.Name = newName;
        ctx.Db.player.Id.Update(updatedPlayer);

        var tanks = ctx.Db.tank.Owner.Filter(ctx.Sender);
        foreach (var tank in tanks)
        {
            var updatedTank = tank;
            updatedTank.Name = newName;
            ctx.Db.tank.Id.Update(updatedTank);
        }

        Log.Info($"Player name changed to: {newName}");
    }
}
