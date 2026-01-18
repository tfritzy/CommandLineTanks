using SpacetimeDB;
using static Types;
using System.Linq;

public static partial class Module
{
    public static class DeleteHomegameIfEmpty
    {
        public static void Call(ReducerContext ctx, string identityString)
        {
            var homegame = ctx.Db.game.Id.Find(identityString);
            if (homegame == null || homegame.Value.GameType != GameType.Home)
            {
                return;
            }

            var hasHumanPlayers = ctx.Db.tank.GameId.Filter(identityString).Any(t => !t.IsBot);
            if (hasHumanPlayers)
            {
                return;
            }

            DeleteGame(ctx, identityString);
            Log.Info($"Deleted empty homegame for identity {identityString}");
        }
    }
}
