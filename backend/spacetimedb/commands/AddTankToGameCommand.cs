using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void AddTankToGame(ReducerContext ctx, Tank tank, TankTransform transform)
    {
        ctx.Db.tank.Insert(tank);
        ctx.Db.tank_transform.Insert(transform);
        
        if (tank.IsBot)
        {
            IncrementBotCount(ctx, tank.GameId);
        }
        else
        {
            IncrementPlayerCount(ctx, tank.GameId);
        }
    }
}
