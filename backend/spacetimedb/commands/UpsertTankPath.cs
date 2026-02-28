using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class UpsertTankPath
    {
        public static void Call(ReducerContext ctx, TankPath tankPath)
        {
            var existingPath = ctx.Db.TankPath.TankId.Find(tankPath.TankId);
            if (existingPath != null)
            {
                ctx.Db.TankPath.TankId.Update(tankPath);
            }
            else
            {
                ctx.Db.TankPath.Insert(tankPath);
            }
        }
    }
}
