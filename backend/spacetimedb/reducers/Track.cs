using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void track(ReducerContext ctx, string gameId, string targetCode)
    {
        MaybeResumeUpdatersForLowTrafficGame(ctx, gameId);

        Tank? tankQuery = ctx.Db.Tank.GameId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;

        if (tank.Health <= 0) return;

        tank = TargetTankByCode.Call(ctx, tank, targetCode);
        ctx.Db.Tank.Id.Update(tank);

        AdvanceTutorialOnTarget.Call(ctx, gameId, tank);
    }
}
