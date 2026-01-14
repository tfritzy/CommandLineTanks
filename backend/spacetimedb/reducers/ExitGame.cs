using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void exitGame(ReducerContext ctx, string gameId, string joinCode)
    {
        if (gameId.Length > 4)
        {
            Log.Info($"Already in homegame, nowhere to exit to");
            return;
        }

        var currentTank = ctx.Db.tank.GameId_Owner.Filter((gameId, ctx.Sender))
            .FirstOrDefault();

        if (currentTank.Id != null)
        {
            RemoveTankFromGame(ctx, currentTank);
        }

        ReturnToHomegame(ctx, joinCode);
        
        Log.Info($"Returned to homegame");
    }
}
