using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class DecrementBotCount
    {
        public static void Call(ReducerContext ctx, string gameId)
        {
            var game = ctx.Db.game.Id.Find(gameId);
            if (game == null) return;

            var updatedGame = game.Value with
            {
                BotCount = Math.Max(0, game.Value.BotCount - 1)
            };
            ctx.Db.game.Id.Update(updatedGame);
        }
    }
}
