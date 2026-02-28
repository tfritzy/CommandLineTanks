using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class RemoveTankFromGame
    {
        public static void Call(ReducerContext ctx, Tank tank)
        {
            var isBot = tank.IsBot;
            var gameId = tank.GameId;
            
            var fireState = ctx.Db.TankFireState.TankId.Find(tank.Id);
            if (fireState != null)
            {
                ctx.Db.TankFireState.TankId.Delete(tank.Id);
            }
            
            DeleteTankPath.Call(ctx, tank.Id);
            DeleteTankGuns(ctx, tank.Id);
            
            ctx.Db.TankTransform.TankId.Delete(tank.Id);
            ctx.Db.Tank.Id.Delete(tank.Id);
            
            if (isBot)
            {
                DecrementBotCount.Call(ctx, gameId);
            }
            else
            {
                DecrementPlayerCount.Call(ctx, gameId);
                
                var allianceColor = GetAllianceColor(tank.Alliance);
                var coloredPlayerName = $"[color={allianceColor}]{tank.Name}[/color]";
                
                ctx.Db.Message.Insert(new Message
                {
                    Id = GenerateId(ctx, "msg"),
                    GameId = gameId,
                    Sender = "System",
                    SenderIdentity = null,
                    Text = $"{coloredPlayerName} left the game",
                    Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
                });
            }
        }
    }
}
