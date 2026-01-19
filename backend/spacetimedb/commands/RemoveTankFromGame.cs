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
            var tankName = tank.Name;
            var tankAlliance = tank.Alliance;
            
            var fireState = ctx.Db.tank_fire_state.TankId.Find(tank.Id);
            if (fireState != null)
            {
                ctx.Db.tank_fire_state.TankId.Delete(tank.Id);
            }
            
            DeleteTankPath.Call(ctx, tank.Id);
            DeleteTankGuns(ctx, tank.Id);
            
            ctx.Db.tank_transform.TankId.Delete(tank.Id);
            ctx.Db.tank.Id.Delete(tank.Id);
            
            if (isBot)
            {
                DecrementBotCount.Call(ctx, gameId);
            }
            else
            {
                DecrementPlayerCount.Call(ctx, gameId);
                
                var game = ctx.Db.game.Id.Find(gameId);
                if (game != null && game.Value.GameType == GameType.Game)
                {
                    var allianceColor = tankAlliance == 0 ? "#ff5555" : "#7fbbdc";
                    var coloredPlayerName = $"[color={allianceColor}]{tankName}[/color]";
                    
                    ctx.Db.message.Insert(new Message
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
}
