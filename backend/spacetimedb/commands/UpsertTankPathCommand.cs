using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class UpsertTankPathCommand
    {
        public static void Call(ReducerContext ctx, TankPath tankPath)
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
}
