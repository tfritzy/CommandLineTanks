using SpacetimeDB;
using System.Linq;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void ensureHomegame(ReducerContext ctx, string gameId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        
        if (gameId.ToLower() != identityString)
        {
            return;
        }

        var homegame = ctx.Db.game.Id.Find(identityString);
        if (homegame == null)
        {
            CreateHomegame(ctx, identityString);
        }

        EnsureTankInHomegame(ctx, identityString, joinCode);
    }
}
