using SpacetimeDB;

public static partial class Module
{
    public static class ClearNonBaseGuns
    {
        public static void Call(ReducerContext ctx, string tankId)
        {
            foreach (var gun in ctx.Db.tank_gun.TankId.Filter(tankId))
            {
                ctx.Db.tank_gun.Id.Delete(gun.Id);
            }
        }
    }
}
