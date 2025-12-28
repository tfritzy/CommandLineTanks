using SpacetimeDB;

public static partial class Module
{
    public static void DeleteTankPathIfExists(ReducerContext ctx, string tankId)
    {
        var pathState = ctx.Db.tank_path.TankId.Find(tankId);
        if (pathState != null)
        {
            ctx.Db.tank_path.TankId.Delete(tankId);
        }
    }

    public static void UpsertTankPath(ReducerContext ctx, TankPath tankPath)
    {
        var existingPath = ctx.Db.tank_path.TankId.Find(tankPath.TankId);
        if (existingPath != null)
        {
            ctx.Db.tank_path.TankId.Update(tankPath);
        }
        else
        {
            ctx.Db.tank_path.Insert(tankPath);
        }
    }
}
