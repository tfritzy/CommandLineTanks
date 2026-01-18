using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class ReplaceBotWithPlayer
    {
        public static void Call(ReducerContext ctx, Tank bot, Identity playerOwner, string playerName, string joinCode)
        {
            var botTransform = ctx.Db.tank_transform.TankId.Find(bot.Id);
            if (botTransform == null)
            {
                return;
            }

            RemoveTankFromGame.Call(ctx, bot);

            var targetCode = AllocateTargetCode(ctx, bot.GameId);
            if (targetCode == null)
            {
                Log.Error($"No available target codes in game {bot.GameId}");
                return;
            }

            var (newTank, newTransform) = BuildTank(
                ctx: ctx,
                gameId: bot.GameId,
                owner: playerOwner,
                name: playerName,
                targetCode: targetCode,
                joinCode: joinCode,
                alliance: bot.Alliance,
                positionX: botTransform.Value.PositionX,
                positionY: botTransform.Value.PositionY,
                aiBehavior: AIBehavior.None);

            AddTankToGame.Call(ctx, newTank, newTransform);
            Log.Info($"Replaced bot {bot.Name} with player {playerName} in game {bot.GameId}");
        }
    }
}
