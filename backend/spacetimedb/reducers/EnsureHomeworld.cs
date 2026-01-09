using SpacetimeDB;
using System.Linq;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void ensureHomeworld(ReducerContext ctx, string worldId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        
        if (worldId.ToLower() != identityString)
        {
            Log.Info($"ensureHomeworld: worldId {worldId} does not match identity {identityString}, ignoring");
            return;
        }

        var homeworld = ctx.Db.world.Id.Find(identityString);
        if (homeworld == null)
        {
            CreateHomeworld(ctx, identityString);
            Log.Info($"ensureHomeworld: Created homeworld for identity {identityString}");
        }
        else
        {
            Log.Info($"ensureHomeworld: Homeworld already exists for identity {identityString}");
        }

        EnsureTankInHomeworld(ctx, identityString, joinCode);
    }
}
