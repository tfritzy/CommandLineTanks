using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void switchGun(ReducerContext ctx, string gameId, int gunIndex)
    {
        Tank? tankQuery = ctx.Db.tank.WorldId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;

        if (tank.Health <= 0) return;

        if (gunIndex < 0 || gunIndex >= tank.Guns.Length) return;

        var selectedGun = tank.Guns[gunIndex];
        var updatedTank = tank with { SelectedGunIndex = gunIndex };
        ctx.Db.tank.Id.Update(updatedTank);
        Log.Info($"Tank {tank.Name} switched to gun at index {gunIndex} ({selectedGun.GunType})");
    }
}
