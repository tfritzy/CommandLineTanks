using SpacetimeDB;
using static Types;
using System.Linq;

public static partial class Module
{
    [Table(Name = "tank_gun", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(TankGun.GameId) })]
    public partial struct TankGun
    {
        [PrimaryKey]
        public string TankId;

        public string GameId;

        public Gun[] Guns;
    }

    public static Gun[] GetTankGuns(ReducerContext ctx, string tankId)
    {
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return [BASE_GUN];
        }
        
        var allGuns = new Gun[tankGunRow.Value.Guns.Length + 1];
        allGuns[0] = BASE_GUN;
        for (int i = 0; i < tankGunRow.Value.Guns.Length; i++)
        {
            allGuns[i + 1] = tankGunRow.Value.Guns[i];
        }
        return allGuns;
    }

    public static void SetTankGuns(ReducerContext ctx, string tankId, string gameId, Gun[] guns)
    {
        var pickupGuns = guns.Where(g => g.GunType != GunType.Base).ToArray();
        
        var existingRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (pickupGuns.Length == 0)
        {
            if (existingRow != null)
            {
                ctx.Db.tank_gun.TankId.Delete(tankId);
            }
            return;
        }

        var tankGunRow = new TankGun
        {
            TankId = tankId,
            GameId = gameId,
            Guns = pickupGuns
        };

        if (existingRow != null)
        {
            ctx.Db.tank_gun.TankId.Update(tankGunRow);
        }
        else
        {
            ctx.Db.tank_gun.Insert(tankGunRow);
        }
    }

    public static Gun? GetTankGunAtIndex(ReducerContext ctx, string tankId, int index)
    {
        if (index == 0)
        {
            return BASE_GUN;
        }
        
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return null;
        }
        
        int pickupIndex = index - 1;
        if (pickupIndex < 0 || pickupIndex >= tankGunRow.Value.Guns.Length)
        {
            return null;
        }
        
        return tankGunRow.Value.Guns[pickupIndex];
    }

    public static void UpdateTankGunAtIndex(ReducerContext ctx, string tankId, int index, Gun gun)
    {
        if (index == 0)
        {
            return;
        }
        
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return;
        }
        
        int pickupIndex = index - 1;
        if (pickupIndex < 0 || pickupIndex >= tankGunRow.Value.Guns.Length)
        {
            return;
        }
        
        var updatedGuns = new Gun[tankGunRow.Value.Guns.Length];
        for (int i = 0; i < tankGunRow.Value.Guns.Length; i++)
        {
            updatedGuns[i] = i == pickupIndex ? gun : tankGunRow.Value.Guns[i];
        }
        
        var updated = tankGunRow.Value with { Guns = updatedGuns };
        ctx.Db.tank_gun.TankId.Update(updated);
    }

    public static void DeleteTankGunAtIndex(ReducerContext ctx, string tankId, int index)
    {
        if (index == 0)
        {
            return;
        }
        
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return;
        }
        
        int pickupIndex = index - 1;
        if (pickupIndex < 0 || pickupIndex >= tankGunRow.Value.Guns.Length)
        {
            return;
        }
        
        var newGuns = new Gun[tankGunRow.Value.Guns.Length - 1];
        int newIndex = 0;
        for (int i = 0; i < tankGunRow.Value.Guns.Length; i++)
        {
            if (i != pickupIndex)
            {
                newGuns[newIndex++] = tankGunRow.Value.Guns[i];
            }
        }
        
        if (newGuns.Length == 0)
        {
            ctx.Db.tank_gun.TankId.Delete(tankId);
        }
        else
        {
            var updated = tankGunRow.Value with { Guns = newGuns };
            ctx.Db.tank_gun.TankId.Update(updated);
        }
    }

    public static int GetTankGunCount(ReducerContext ctx, string tankId)
    {
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return 1;
        }
        return tankGunRow.Value.Guns.Length + 1;
    }

    public static void AddTankGun(ReducerContext ctx, string tankId, string gameId, Gun gun)
    {
        if (gun.GunType == GunType.Base)
        {
            return;
        }
        
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        
        Gun[] newGuns;
        if (tankGunRow == null)
        {
            newGuns = [gun];
        }
        else
        {
            newGuns = new Gun[tankGunRow.Value.Guns.Length + 1];
            for (int i = 0; i < tankGunRow.Value.Guns.Length; i++)
            {
                newGuns[i] = tankGunRow.Value.Guns[i];
            }
            newGuns[tankGunRow.Value.Guns.Length] = gun;
        }
        
        var updated = new TankGun
        {
            TankId = tankId,
            GameId = gameId,
            Guns = newGuns
        };
        
        if (tankGunRow == null)
        {
            ctx.Db.tank_gun.Insert(updated);
        }
        else
        {
            ctx.Db.tank_gun.TankId.Update(updated);
        }
    }
}
