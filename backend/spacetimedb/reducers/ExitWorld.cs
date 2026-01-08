using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void exitWorld(ReducerContext ctx, string worldId, string joinCode)
    {
        var currentMetadata = ctx.Db.tank_metadata.WorldId_Owner.Filter((worldId, ctx.Sender))
            .FirstOrDefault();

        if (currentMetadata.TankId != null)
        {
            var tank = ctx.Db.tank.Id.Find(currentMetadata.TankId);
            if (tank != null)
            {
                RemoveTankFromWorld(ctx, tank.Value, currentMetadata);
            }
        }

        ReturnToHomeworld(ctx, joinCode);
        
        Log.Info($"Returned to homeworld");
    }
}
