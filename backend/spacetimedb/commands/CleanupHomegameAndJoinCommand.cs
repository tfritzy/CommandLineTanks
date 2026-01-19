using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void CleanupHomegameAndJoinCommand(ReducerContext ctx, string gameId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var existingTanks = ctx.Db.tank.Owner.Filter(ctx.Sender);

        foreach (var existingTank in existingTanks)
        {
            RemoveTankFromGame.Call(ctx, existingTank);
        }

        DeleteHomegameIfEmpty.Call(ctx, identityString);

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var assignedAlliance = GetBalancedAlliance.Call(ctx, gameId);
        var botToReplace = FindBotInAlliance.Call(ctx, gameId, assignedAlliance);

        if (botToReplace != null)
        {
            ReplaceBotWithPlayer.Call(ctx, botToReplace.Value, ctx.Sender, playerName, joinCode);
        }
        else
        {
            var result = CreateTankInGame.Call(ctx, gameId, ctx.Sender, joinCode);
            if (result != null)
            {
                var (tank, transform) = result.Value;
                AddTankToGame.Call(ctx, tank, transform);
            }
        }

        EnsureMinimumPlayersPerTeam.Call(ctx, gameId);

        if (player != null)
        {
            var game = ctx.Db.game.Id.Find(gameId);
            if (game != null)
            {
                TrackDailyActiveUserCommand(ctx, player.Value.Id, game.Value.GameType);
            }
        }
    }
}
