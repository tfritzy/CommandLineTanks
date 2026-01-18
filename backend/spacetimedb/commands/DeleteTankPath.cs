using SpacetimeDB;

public static partial class Module
{
    public static class DeleteTankPath
    {
        public static void Call(ReducerContext ctx, string tankId)
        {
            var pathState = ctx.Db.tank_path.TankId.Find(tankId);
            if (pathState != null)
            {
                ctx.Db.tank_path.TankId.Delete(tankId);
            }
        }
    }
}
