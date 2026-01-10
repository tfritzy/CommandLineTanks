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
            Log.Info($"ensureHomegame: gameId {gameId} does not match identity {identityString}, ignoring");
            return;
        }

        var homegame = ctx.Db.game.Id.Find(identityString);
        if (homegame == null)
        {
            CreateHomeworld(ctx, identityString);
            Log.Info($"ensureHomegame: Created homegame for identity {identityString}");
        }
        else
        {
            Log.Info($"ensureHomegame: Homegame already exists for identity {identityString}");
        }

        EnsureTankInHomeworld(ctx, identityString, joinCode);
    }
}
