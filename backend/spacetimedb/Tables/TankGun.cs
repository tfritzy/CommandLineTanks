using SpacetimeDB;
using static Types;
using System.Linq;

public static partial class Module
{
    [Table(Name = "tank_gun", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(TankGun.TankId) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(TankGun.GameId) })]
    public partial struct TankGun
    {
        [AutoInc]
        [PrimaryKey]
        public ulong Id;

        public string TankId;

        public string GameId;

        public int SlotIndex;

        public Gun Gun;
    }

    public static Gun[] GetTankGuns(ReducerContext ctx, string tankId)
    {
        var gunRows = ctx.Db.tank_gun.TankId.Filter(tankId);
        var gunsList = new System.Collections.Generic.List<TankGun>();
        
        foreach (var gunRow in gunRows)
        {
            gunsList.Add(gunRow);
        }
        
        gunsList.Sort((a, b) => a.SlotIndex.CompareTo(b.SlotIndex));
        
        return gunsList.Select(g => g.Gun).ToArray();
    }

    public static void SetTankGuns(ReducerContext ctx, string tankId, string gameId, Gun[] guns)
    {
        foreach (var existingGun in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            ctx.Db.tank_gun.Id.Delete(existingGun.Id);
        }

        for (int i = 0; i < guns.Length; i++)
        {
            ctx.Db.tank_gun.Insert(new TankGun
            {
                Id = 0,
                TankId = tankId,
                GameId = gameId,
                SlotIndex = i,
                Gun = guns[i]
            });
        }
    }

    public static Gun? GetTankGunAtIndex(ReducerContext ctx, string tankId, int index)
    {
        foreach (var gunRow in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            if (gunRow.SlotIndex == index)
            {
                return gunRow.Gun;
            }
        }
        return null;
    }

    public static void UpdateTankGunAtIndex(ReducerContext ctx, string tankId, int index, Gun gun)
    {
        foreach (var gunRow in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            if (gunRow.SlotIndex == index)
            {
                var updated = gunRow with { Gun = gun };
                ctx.Db.tank_gun.Id.Update(updated);
                return;
            }
        }
    }

    public static void DeleteTankGunAtIndex(ReducerContext ctx, string tankId, int index)
    {
        foreach (var gunRow in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            if (gunRow.SlotIndex == index)
            {
                ctx.Db.tank_gun.Id.Delete(gunRow.Id);
            }
            else if (gunRow.SlotIndex > index)
            {
                var updated = gunRow with { SlotIndex = gunRow.SlotIndex - 1 };
                ctx.Db.tank_gun.Id.Update(updated);
            }
        }
    }

    public static int GetTankGunCount(ReducerContext ctx, string tankId)
    {
        int count = 0;
        foreach (var gunRow in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            count++;
        }
        return count;
    }

    public static void AddTankGun(ReducerContext ctx, string tankId, string gameId, Gun gun)
    {
        int maxSlotIndex = -1;
        foreach (var gunRow in ctx.Db.tank_gun.TankId.Filter(tankId))
        {
            if (gunRow.SlotIndex > maxSlotIndex)
            {
                maxSlotIndex = gunRow.SlotIndex;
            }
        }

        ctx.Db.tank_gun.Insert(new TankGun
        {
            Id = 0,
            TankId = tankId,
            GameId = gameId,
            SlotIndex = maxSlotIndex + 1,
            Gun = gun
        });
    }
}
