using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "tank_gun", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(TankGun.TankId), nameof(TankGun.SlotIndex) })]
    public partial struct TankGun
    {
        [PrimaryKey]
        [AutoInc]
        public ulong Id;

        [SpacetimeDB.Index.BTree]
        public string TankId;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        public int SlotIndex;

        public Gun Gun;
    }

    public static void ClearNonBaseGuns(ReducerContext ctx, string tankId)
    {
        foreach (var gun in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            ctx.Db.tank_gun.Id.Delete(gun.Id);
        }
    }

    public static void DeleteTankGuns(ReducerContext ctx, string tankId)
    {
        foreach (var gun in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            ctx.Db.tank_gun.Id.Delete(gun.Id);
        }
    }
}
