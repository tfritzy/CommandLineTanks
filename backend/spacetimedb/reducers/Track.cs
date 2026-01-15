using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void track(ReducerContext ctx, string gameId, string targetCode)
    {
        MaybeResumeUpdatersForHomeworld(ctx, gameId);

        Tank? tankQuery = ctx.Db.tank.GameId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;

        if (tank.Health <= 0) return;

        tank = TargetTankByCode(ctx, tank, targetCode);
        ctx.Db.tank.Id.Update(tank);

        MaybeAdvanceFromTargetEnemy(ctx, gameId, tank);
    }
}
