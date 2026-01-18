using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class DecrementPlayerCount
    {
        public static void Call(ReducerContext ctx, string gameId)
        {
            var game = ctx.Db.game.Id.Find(gameId);
            if (game == null) return;

            var updatedGame = game.Value with
            {
                CurrentPlayerCount = Math.Max(0, game.Value.CurrentPlayerCount - 1)
            };
            ctx.Db.game.Id.Update(updatedGame);

            if (updatedGame.CurrentPlayerCount == 0 && updatedGame.GameType == GameType.Game)
            {
                DeleteGame(ctx, gameId);
                Log.Info($"Deleted game {gameId} after last human player left");
            }
        }
    }
}
