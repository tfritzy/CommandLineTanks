using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class AddTankToGame
    {
        public static void Call(ReducerContext ctx, Tank tank, TankTransform transform)
        {
            ctx.Db.tank.Insert(tank);
            ctx.Db.tank_transform.Insert(transform);
            
            if (tank.IsBot)
            {
                IncrementBotCount.Call(ctx, tank.GameId);
            }
            else
            {
                IncrementPlayerCount.Call(ctx, tank.GameId);
                
                var game = ctx.Db.game.Id.Find(tank.GameId);
                if (game != null && game.Value.GameType == GameType.Game)
                {
                    var allianceColor = GetAllianceColor(tank.Alliance);
                    var coloredPlayerName = $"[color={allianceColor}]{tank.Name}[/color]";
                    
                    ctx.Db.message.Insert(new Message
                    {
                        Id = GenerateId(ctx, "msg"),
                        GameId = tank.GameId,
                        Sender = "System",
                        SenderIdentity = null,
                        Text = $"{coloredPlayerName} joined the game",
                        Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
                    });
                }
            }
        }
    }
}
