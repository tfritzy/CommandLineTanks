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

        var existingTank = ctx.Db.tank.WorldId_Owner.Filter((identityString, ctx.Sender))
            .FirstOrDefault();
        
        if (existingTank.Id != null)
        {
            var updatedTank = existingTank with { JoinCode = joinCode };
            ctx.Db.tank.Id.Update(updatedTank);
            StartWorldTickers(ctx, identityString);
            Log.Info($"ensureHomeworld: Updated existing tank with new join code");
            return;
        }

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var (tank, transform) = BuildTank(
            ctx: ctx,
            worldId: identityString,
            owner: ctx.Sender,
            name: playerName,
            targetCode: "",
            joinCode: joinCode,
            alliance: 0,
            positionX: HOMEWORLD_WIDTH / 2 + .5f,
            positionY: HOMEWORLD_HEIGHT / 2 + .5f,
            aiBehavior: AIBehavior.None);

        AddTankToWorld(ctx, tank, transform);
        StartWorldTickers(ctx, identityString);
        Log.Info($"ensureHomeworld: Created tank for identity {identityString}");
    }
}
