using SpacetimeDB;
using System;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void fire(ReducerContext ctx, string gameId)
    {
        MaybeResumeUpdatersForLowTrafficGame(ctx, gameId);

        Tank? tankQuery = ctx.Db.Tank.GameId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;
        
        var transformQuery = ctx.Db.TankTransform.TankId.Find(tank.Id);
        if (transformQuery == null) return;
        var transform = transformQuery.Value;

        tank = FireTankWeapon.Call(ctx, tank, transform);
        ctx.Db.Tank.Id.Update(tank);
    }
}
