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

    public static int GetGunCount(ReducerContext ctx, string tankId)
    {
        int count = 0;
        foreach (var _ in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            count++;
        }
        return count;
    }

    public static Gun? GetGunAtSlot(ReducerContext ctx, string tankId, int slotIndex)
    {
        var gun = ctx.Db.tank_gun.TankId_SlotIndex.Filter((tankId, slotIndex)).FirstOrDefault();
        if (gun.TankId == null)
        {
            return null;
        }
        return gun.Gun;
    }

    public static void SetTankGuns(ReducerContext ctx, string tankId, string gameId, Gun[] guns)
    {
        foreach (var existing in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            ctx.Db.tank_gun.Id.Delete(existing.Id);
        }

        for (int i = 0; i < guns.Length; i++)
        {
            ctx.Db.tank_gun.Insert(new TankGun
            {
                TankId = tankId,
                GameId = gameId,
                SlotIndex = i,
                Gun = guns[i]
            });
        }
    }

    public static void ResetTankToBaseGun(ReducerContext ctx, string tankId, string gameId)
    {
        foreach (var existing in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            ctx.Db.tank_gun.Id.Delete(existing.Id);
        }

        ctx.Db.tank_gun.Insert(new TankGun
        {
            TankId = tankId,
            GameId = gameId,
            SlotIndex = 0,
            Gun = BASE_GUN
        });
    }

    public static void DeleteTankGuns(ReducerContext ctx, string tankId)
    {
        foreach (var gun in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            ctx.Db.tank_gun.Id.Delete(gun.Id);
        }
    }
}
