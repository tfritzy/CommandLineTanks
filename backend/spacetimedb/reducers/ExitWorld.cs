using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void exitWorld(ReducerContext ctx, string worldId, string joinCode)
    {
        var currentTank = ctx.Db.tank.WorldId.Filter(worldId)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();

        if (currentTank.Id != null)
        {
            RemoveTankFromWorld(ctx, currentTank);
        }

        ReturnToHomeworld(ctx, joinCode);
        
        Log.Info($"Returned to homeworld");
    }
}
