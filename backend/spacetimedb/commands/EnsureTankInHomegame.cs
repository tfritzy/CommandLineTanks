using SpacetimeDB;
using static Types;
using System.Linq;

public static partial class Module
{
    public static class EnsureTankInHomegame
    {
        public static void Call(ReducerContext ctx, string identityString, string joinCode)
        {
            var existingTank = ctx.Db.tank.GameId_Owner.Filter((identityString, ctx.Sender))
                .FirstOrDefault();
            
            if (existingTank.Id != null)
            {
                var updatedTank = existingTank with { JoinCode = joinCode };
                ctx.Db.tank.Id.Update(updatedTank);
                StartGameTickers(ctx, identityString);
                Log.Info($"Updated existing homegame tank with new join code");
                return;
            }

            var player = ctx.Db.player.Identity.Find(ctx.Sender);
            var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

            var (tank, transform) = BuildTank(
                ctx: ctx,
                gameId: identityString,
                owner: ctx.Sender,
                name: playerName,
                targetCode: "",
                joinCode: joinCode,
                alliance: 0,
                positionX: HOMEGAME_WIDTH / 2 + .5f,
                positionY: HOMEGAME_HEIGHT / 2 + .5f,
                aiBehavior: AIBehavior.None);

            AddTankToGame.Call(ctx, tank, transform);
            StartGameTickers(ctx, identityString);
            Log.Info($"Created homegame tank for identity {identityString}");
        }
    }
}
