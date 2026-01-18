using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class CreateTankInGame
    {
        public static (Tank, TankTransform)? Call(ReducerContext ctx, string gameId, Identity owner, string joinCode)
        {
            Tank? existingTank = ctx.Db.tank.GameId_Owner.Filter((gameId, owner)).FirstOrDefault();
            if (existingTank != null && !string.IsNullOrEmpty(existingTank.Value.Id))
            {
                Log.Info($"Player already has tank in game {gameId}, removing before creating new one");
                RemoveTankFromGame.Call(ctx, existingTank.Value);
            }

            var game = ctx.Db.game.Id.Find(gameId);
            if (game == null)
            {
                Log.Error($"Game {gameId} not found");
                return null;
            }

            var targetCode = AllocateTargetCode.Call(ctx, gameId);
            if (targetCode == null)
            {
                Log.Error($"No available target codes in game {gameId}");
                return null;
            }

            var player = ctx.Db.player.Identity.Find(owner);
            var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

            int assignedAlliance = GetBalancedAlliance.Call(ctx, gameId);
            var (spawnX, spawnY) = FindSpawnPosition.Call(ctx, game.Value, assignedAlliance, ctx.Rng);

            var (tank, transform) = BuildTank(
                ctx: ctx,
                gameId: gameId,
                owner: owner,
                name: playerName,
                targetCode: targetCode,
                joinCode: joinCode,
                alliance: assignedAlliance,
                positionX: spawnX,
                positionY: spawnY,
                aiBehavior: AIBehavior.None);
            return (tank, transform);
        }
    }
}
