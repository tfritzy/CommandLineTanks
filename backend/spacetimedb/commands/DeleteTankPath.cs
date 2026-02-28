using SpacetimeDB;

public static partial class Module
{
    public static class DeleteTankPath
    {
        public static void Call(ReducerContext ctx, string tankId)
        {
            var pathState = ctx.Db.TankPath.TankId.Find(tankId);
            if (pathState != null)
            {
                ctx.Db.TankPath.TankId.Delete(tankId);
            }
        }
    }
}
