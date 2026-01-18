using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void ensureTutorial(ReducerContext ctx, string gameId, string joinCode)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Info("ensureTutorial called with no player");
            return;
        }

        var expectedGameId = GetTutorialGameId(ctx.Sender);
        if (gameId.ToLower() != expectedGameId.ToLower())
        {
            return;
        }

        EnsureTutorialGameCommand.Call(ctx, ctx.Sender, joinCode);
    }

    [Reducer]
    public static void tutorialComplete(ReducerContext ctx, string gameId, string joinCode)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null || game.Value.GameType != Types.GameType.Tutorial)
        {
            Log.Info("tutorialComplete called on non-tutorial game");
            return;
        }

        if (!game.Value.Owner.HasValue || !game.Value.Owner.Value.Equals(ctx.Sender))
        {
            Log.Info("tutorialComplete called by non-owner");
            return;
        }

        CompleteTutorialCommand.Call(ctx, ctx.Sender);

        ReturnToHomegame.Call(ctx, joinCode);

        Log.Info($"Tutorial completed for {ctx.Sender}");
    }

    [Reducer]
    public static void tutorialSkip(ReducerContext ctx, string gameId, string joinCode)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null || game.Value.GameType != Types.GameType.Tutorial)
        {
            Log.Info("tutorialSkip called on non-tutorial game");
            return;
        }

        if (!game.Value.Owner.HasValue || !game.Value.Owner.Value.Equals(ctx.Sender))
        {
            Log.Info("tutorialSkip called by non-owner");
            return;
        }

        CompleteTutorialCommand.Call(ctx, ctx.Sender);

        ReturnToHomegame.Call(ctx, joinCode);

        Log.Info($"Tutorial skipped for {ctx.Sender}");
    }
}
