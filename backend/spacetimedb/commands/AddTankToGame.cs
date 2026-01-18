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
            }
        }
    }
}
