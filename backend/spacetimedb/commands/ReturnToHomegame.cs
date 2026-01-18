using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class ReturnToHomegame
    {
        public static void Call(ReducerContext ctx, string joinCode)
        {
            var identityString = ctx.Sender.ToString().ToLower();
            var homegame = ctx.Db.game.Id.Find(identityString);
            if (homegame == null)
            {
                CreateHomegame(ctx, identityString);
            }

            EnsureTankInHomegame.Call(ctx, identityString, joinCode);
        }
    }
}
