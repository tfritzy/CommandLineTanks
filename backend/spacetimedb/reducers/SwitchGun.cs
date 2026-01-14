using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void switchGun(ReducerContext ctx, string gameId, int gunIndex)
    {
        Tank? tankQuery = ctx.Db.tank.GameId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;

        if (tank.Health <= 0) return;

        var gunQuery = ctx.Db.tank_gun.TankId_SlotIndex.Filter((tank.Id, gunIndex)).FirstOrDefault();
        if (gunQuery.TankId == null) return;

        var updatedTank = tank with { SelectedGunIndex = gunIndex };
        ctx.Db.tank.Id.Update(updatedTank);
    }
}
