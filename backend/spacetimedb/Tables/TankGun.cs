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
        
        return tankGunRow.Value.Guns;
    }

    public static void SetTankGuns(ReducerContext ctx, string tankId, string gameId, Gun[] guns)
    {
        var tankGunRow = new TankGun
        {
            TankId = tankId,
            GameId = gameId,
            Guns = guns
        };

        var existingRow = ctx.Db.tank_gun.TankId.Find(tankId);
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
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return index == 0 ? BASE_GUN : null;
        }
        
        if (index < 0 || index >= tankGunRow.Value.Guns.Length)
        {
            return null;
        }
        
        return tankGunRow.Value.Guns[index];
    }

    public static void UpdateTankGunAtIndex(ReducerContext ctx, string tankId, int index, Gun gun)
    {
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return;
        }
        
        if (index < 0 || index >= tankGunRow.Value.Guns.Length)
        {
            return;
        }
        
        var updatedGuns = new Gun[tankGunRow.Value.Guns.Length];
        for (int i = 0; i < tankGunRow.Value.Guns.Length; i++)
        {
            updatedGuns[i] = i == index ? gun : tankGunRow.Value.Guns[i];
        }
        
        var updated = tankGunRow.Value with { Guns = updatedGuns };
        ctx.Db.tank_gun.TankId.Update(updated);
    }

    public static void DeleteTankGunAtIndex(ReducerContext ctx, string tankId, int index)
    {
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return;
        }
        
        if (index < 0 || index >= tankGunRow.Value.Guns.Length)
        {
            return;
        }
        
        var newGuns = new Gun[tankGunRow.Value.Guns.Length - 1];
        int newIndex = 0;
        for (int i = 0; i < tankGunRow.Value.Guns.Length; i++)
        {
            if (i != index)
            {
                newGuns[newIndex++] = tankGunRow.Value.Guns[i];
            }
        }
        
        var updated = tankGunRow.Value with { Guns = newGuns };
        ctx.Db.tank_gun.TankId.Update(updated);
    }

    public static int GetTankGunCount(ReducerContext ctx, string tankId)
    {
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        if (tankGunRow == null)
        {
            return 1;
        }
        return tankGunRow.Value.Guns.Length;
    }

    public static void AddTankGun(ReducerContext ctx, string tankId, string gameId, Gun gun)
    {
        var tankGunRow = ctx.Db.tank_gun.TankId.Find(tankId);
        
        if (tankGunRow == null)
        {
            var newRow = new TankGun
            {
                TankId = tankId,
                GameId = gameId,
                Guns = [BASE_GUN, gun]
            };
            ctx.Db.tank_gun.Insert(newRow);
        }
        else
        {
            var newGuns = new Gun[tankGunRow.Value.Guns.Length + 1];
            for (int i = 0; i < tankGunRow.Value.Guns.Length; i++)
            {
                newGuns[i] = tankGunRow.Value.Guns[i];
            }
            newGuns[tankGunRow.Value.Guns.Length] = gun;
            
            var updated = tankGunRow.Value with { Guns = newGuns };
            ctx.Db.tank_gun.TankId.Update(updated);
        }
    }
}
