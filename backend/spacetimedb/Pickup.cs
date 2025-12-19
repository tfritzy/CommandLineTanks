using SpacetimeDB;
using static Types;

public static partial class Module
{
    public const int HEALTH_PICKUP_HEAL_AMOUNT = 50;

    public static readonly TerrainDetailType[] PICKUP_TYPES = new TerrainDetailType[]
    {
        TerrainDetailType.TripleShooterPickup,
        TerrainDetailType.MissileLauncherPickup,
        TerrainDetailType.HealthPickup,
        TerrainDetailType.BoomerangPickup,
        TerrainDetailType.GrenadePickup
    };

    public static bool TryCollectPickup(ReducerContext ctx, ref Tank tank, ref bool needsUpdate, Module.Pickup pickup)
    {
        switch (pickup.Type)
        {
            case TerrainDetailType.HealthPickup:
                return TryCollectHealthPickup(ctx, ref tank, ref needsUpdate, pickup);

            case TerrainDetailType.TripleShooterPickup:
                return TryCollectGunPickup(ctx, ref tank, ref needsUpdate, pickup, TRIPLE_SHOOTER_GUN);

            case TerrainDetailType.MissileLauncherPickup:
                return TryCollectGunPickup(ctx, ref tank, ref needsUpdate, pickup, MISSILE_LAUNCHER_GUN);

            case TerrainDetailType.BoomerangPickup:
                return TryCollectGunPickup(ctx, ref tank, ref needsUpdate, pickup, BOOMERANG_GUN);

            case TerrainDetailType.GrenadePickup:
                return TryCollectGunPickup(ctx, ref tank, ref needsUpdate, pickup, GRENADE_GUN);

            default:
                return false;
        }
    }

    private static bool TryCollectHealthPickup(ReducerContext ctx, ref Tank tank, ref bool needsUpdate, Module.Pickup pickup)
    {
        int newHealth = Math.Min(tank.Health + HEALTH_PICKUP_HEAL_AMOUNT, tank.MaxHealth);
        if (newHealth > tank.Health)
        {
            tank = tank with { Health = newHealth };
            needsUpdate = true;
            ctx.Db.pickup.Id.Delete(pickup.Id);
            return true;
        }
        return false;
    }

    private static bool TryCollectGunPickup(ReducerContext ctx, ref Tank tank, ref bool needsUpdate, Module.Pickup pickup, Gun gunToAdd)
    {
        int existingGunIndex = -1;
        for (int i = 0; i < tank.Guns.Length; i++)
        {
            if (tank.Guns[i].GunType == gunToAdd.GunType)
            {
                existingGunIndex = i;
                break;
            }
        }

        if (existingGunIndex >= 0)
        {
            var existingGun = tank.Guns[existingGunIndex];
            if (existingGun.Ammo != null && gunToAdd.Ammo != null)
            {
                existingGun.Ammo = existingGun.Ammo.Value + gunToAdd.Ammo.Value;
                tank.Guns[existingGunIndex] = existingGun;
                needsUpdate = true;
                ctx.Db.pickup.Id.Delete(pickup.Id);
                return true;
            }
        }
        else if (tank.Guns.Length < 3)
        {
            tank = tank with
            {
                Guns = [.. tank.Guns, gunToAdd],
                SelectedGunIndex = tank.Guns.Length
            };
            needsUpdate = true;
            ctx.Db.pickup.Id.Delete(pickup.Id);
            return true;
        }

        return false;
    }
}
