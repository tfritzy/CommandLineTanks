using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void switchGun(ReducerContext ctx, string worldId, int gunIndex)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.IsDead) return;

        if (gunIndex < 0 || gunIndex >= tank.Guns.Length) return;

        var selectedGun = tank.Guns[gunIndex];
        tank.SelectedGunIndex = gunIndex;
        ctx.Db.tank.Id.Update(tank);
        Log.Info($"Tank {tank.Name} switched to gun at index {gunIndex} ({selectedGun.GunType})");
    }
}
