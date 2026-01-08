using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void CleanupHomeworldAndJoinCommand(ReducerContext ctx, string worldId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var existingMetadatas = ctx.Db.tank_metadata.Owner.Filter(ctx.Sender);

        foreach (var existingMetadata in existingMetadatas)
        {
            var tank = ctx.Db.tank.Id.Find(existingMetadata.TankId);
            if (tank != null)
            {
                RemoveTankFromWorld(ctx, tank.Value, existingMetadata);
            }
        }

        DeleteHomeworldIfEmpty(ctx, identityString);

        var result = CreateTankInWorld(ctx, worldId, ctx.Sender, joinCode);
        if (result != null)
        {
            var (tank, metadata, position) = result.Value;
            AddTankToWorld(ctx, tank, metadata, position);
        }
    }
}
