using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void switchGun(ReducerContext ctx, string worldId, int gunIndex)
    {
        TankMetadata? metadataQuery = ctx.Db.tank_metadata.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (metadataQuery == null || metadataQuery.Value.TankId == null) return;
        var metadata = metadataQuery.Value;
        
        var tankQuery = ctx.Db.tank.Id.Find(metadata.TankId);
        if (tankQuery == null) return;
        var tank = tankQuery.Value;

        if (tank.Health <= 0) return;

        if (gunIndex < 0 || gunIndex >= tank.Guns.Length) return;

        var selectedGun = tank.Guns[gunIndex];
        var updatedTank = tank with { SelectedGunIndex = gunIndex };
        ctx.Db.tank.Id.Update(updatedTank);
        Log.Info($"Tank {metadata.Name} switched to gun at index {gunIndex} ({selectedGun.GunType})");
    }
}
