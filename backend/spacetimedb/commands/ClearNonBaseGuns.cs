using SpacetimeDB;

public static partial class Module
{
    public static class ClearNonBaseGuns
    {
        public static void Call(ReducerContext ctx, string tankId)
        {
            foreach (var gun in ctx.Db.TankGun.TankId.Filter(tankId))
            {
                ctx.Db.TankGun.Id.Delete(gun.Id);
            }
        }
    }
}
