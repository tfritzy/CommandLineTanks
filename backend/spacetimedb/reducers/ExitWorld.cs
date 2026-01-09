using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void exitWorld(ReducerContext ctx, string worldId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        
        if (worldId.ToLower() == identityString)
        {
            Log.Info($"Already in homeworld, nowhere to exit to");
            return;
        }

        var currentTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender))
            .FirstOrDefault();

        if (currentTank.Id != null)
        {
            RemoveTankFromWorld(ctx, currentTank);
        }

        ReturnToHomeworld(ctx, joinCode);
        
        Log.Info($"Returned to homeworld");
    }
}
