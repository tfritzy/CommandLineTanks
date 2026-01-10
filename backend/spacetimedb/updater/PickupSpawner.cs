using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;

public static partial class PickupSpawner
{
    public static readonly PickupType[] PICKUP_TYPES = new PickupType[]
    {
        PickupType.TripleShooter,
        PickupType.MissileLauncher,
        PickupType.Health,
        PickupType.Boomerang,
        PickupType.Grenade,
        PickupType.Rocket,
        PickupType.Moag,
        PickupType.Shield,
        PickupType.Sniper
    };

    public static readonly PickupType[] NON_HEALTH_PICKUP_TYPES = PICKUP_TYPES
        .Where(t => t != PickupType.Health)
        .ToArray();

    public static readonly PickupType[] HOMEGAME_PICKUP_TYPES = new PickupType[]
    {
        PickupType.TripleShooter,
        PickupType.MissileLauncher,
        PickupType.Boomerang,
        PickupType.Grenade,
        PickupType.Rocket,
        PickupType.Moag,
        PickupType.Sniper
    };

    private static readonly Dictionary<PickupType, Gun> PickupToGunMap = new Dictionary<PickupType, Gun>
    {
        { PickupType.TripleShooter, Module.TRIPLE_SHOOTER_GUN },
        { PickupType.MissileLauncher, Module.MISSILE_LAUNCHER_GUN },
        { PickupType.Boomerang, Module.BOOMERANG_GUN },
        { PickupType.Grenade, Module.GRENADE_GUN },
        { PickupType.Rocket, Module.ROCKET_GUN },
        { PickupType.Moag, Module.MOAG_GUN },
        { PickupType.Sniper, Module.SNIPER_GUN }
    };

    public static PickupType? GetPickupTypeForGun(GunType gunType)
    {
        foreach (var kvp in PickupToGunMap)
        {
            if (kvp.Value.GunType == gunType)
            {
                return kvp.Key;
            }
        }
        return null;
    }

    public static int? GetAmmoForPickupType(PickupType pickupType)
    {
        if (PickupToGunMap.TryGetValue(pickupType, out Gun gun))
        {
            return gun.Ammo;
        }
        return null;
    }

    [Table(Scheduled = nameof(SpawnPickup))]
    public partial struct ScheduledPickupSpawn
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string GameId;
    }

    [Reducer]
    public static void SpawnPickup(ReducerContext ctx, ScheduledPickupSpawn args)
    {
        var game = ctx.Db.game.Id.Find(args.GameId);
        if (game == null) return;

        if (game.Value.IsHomeGame)
        {
            SpawnHomeworldPickups(ctx, args.GameId);
        }
        else
        {
            var existingPickups = ctx.Db.pickup.GameId.Filter(args.GameId);
            int pickupCount = 0;
            foreach (var pickup in existingPickups)
            {
                pickupCount++;
            }

            if (pickupCount >= 15)
            {
                return;
            }

            var traversibilityMap = ctx.Db.traversibility_map.GameId.Find(args.GameId);
            if (traversibilityMap == null) return;

            int maxAttempts = 100;
            for (int attempt = 0; attempt < maxAttempts; attempt++)
            {
                if (TrySpawnPickup(ctx, args.GameId, traversibilityMap.Value))
                {
                    break;
                }
            }
        }
    }

    public static void SpawnHomeworldPickups(ReducerContext ctx, string gameId)
    {
        foreach (var pickupType in HOMEGAME_PICKUP_TYPES)
        {
            var (gridX, gridY) = GetHomeworldPickupPosition(pickupType);
            
            if (gridX < 0 || gridY < 0)
            {
                continue;
            }

            var existingPickup = ctx.Db.pickup.WorldId_GridX_GridY.Filter((gameId, gridX, gridY));
            
            if (existingPickup.Any())
            {
                continue;
            }

            var pickupId = Module.GenerateId(ctx, "pickup");
            
            ctx.Db.pickup.Insert(Module.Pickup.Build(
                ctx: ctx,
                id: pickupId,
                gameId: gameId,
                positionX: gridX + 0.5f,
                positionY: gridY + 0.5f,
                gridX: gridX,
                gridY: gridY,
                type: pickupType,
                ammo: GetAmmoForPickupType(pickupType)
            ));
        }
    }

    public static void InitializePickupSpawner(ReducerContext ctx, string gameId, int initialPickupCount)
    {
        ctx.Db.ScheduledPickupSpawn.Insert(new ScheduledPickupSpawn
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 8_000_000 }),
            GameId = gameId
        });

        var traversibilityMap = ctx.Db.traversibility_map.GameId.Find(gameId);
        if (traversibilityMap == null) return;

        int spawnedCount = 0;
        int maxAttempts = 500;

        for (int attempt = 0; attempt < maxAttempts && spawnedCount < initialPickupCount; attempt++)
        {
            if (TrySpawnPickup(ctx, gameId, traversibilityMap.Value))
            {
                spawnedCount++;
            }
        }

        Log.Info($"Initialized {spawnedCount} pickups for game {gameId}");
    }

    public static bool TrySpawnPickup(ReducerContext ctx, string gameId, Module.TraversibilityMap traversibilityMap)
    {
        var (spawnX, spawnY) = GenerateNormalDistributedPosition(
            ctx.Rng,
            traversibilityMap.Width,
            traversibilityMap.Height
        );

        if (spawnX < 0 || spawnX >= traversibilityMap.Width || spawnY < 0 || spawnY >= traversibilityMap.Height)
            return false;

        int tileIndex = spawnY * traversibilityMap.Width + spawnX;
        if (tileIndex >= traversibilityMap.Map.Length || !traversibilityMap.Map[tileIndex])
            return false;

        float centerX = spawnX + 0.5f;
        float centerY = spawnY + 0.5f;

        var existingDetail = ctx.Db.terrain_detail.WorldId_GridX_GridY.Filter((gameId, spawnX, spawnY));
        foreach (var detail in existingDetail)
        {
            return false;
        }

        var existingPickup = ctx.Db.pickup.WorldId_GridX_GridY.Filter((gameId, spawnX, spawnY));
        foreach (var p in existingPickup)
        {
            return false;
        }

        PickupType pickupType;
        if (ctx.Rng.NextDouble() < 0.33)
        {
            pickupType = PickupType.Health;
        }
        else
        {
            int pickupTypeIndex = ctx.Rng.Next(NON_HEALTH_PICKUP_TYPES.Length);
            pickupType = NON_HEALTH_PICKUP_TYPES[pickupTypeIndex];
        }

        var pickupId = Module.GenerateId(ctx, "pickup");
        
        ctx.Db.pickup.Insert(Module.Pickup.Build(
            ctx: ctx,
            id: pickupId,
            gameId: gameId,
            positionX: centerX,
            positionY: centerY,
            gridX: spawnX,
            gridY: spawnY,
            type: pickupType,
            ammo: GetAmmoForPickupType(pickupType)
        ));

        Log.Info($"Spawned {pickupType} at ({centerX}, {centerY}) in game {gameId}");
        return true;
    }

    public static (int gridX, int gridY) GetHomeworldPickupPosition(PickupType pickupType)
    {
        int index = Array.IndexOf(HOMEGAME_PICKUP_TYPES, pickupType);

        if (index < 0)
        {
            return (-1, -1);
        }

        int halfCount = HOMEGAME_PICKUP_TYPES.Length / 2;
        int column = index < halfCount ? 0 : 1;
        int rowInColumn = index < halfCount ? index : index - halfCount;
        
        int gridX = column == 0 ? 12 : 17;
        int gridY = 11 + (rowInColumn * 2);
        return (gridX, gridY);
    }

    public static (int x, int y) GenerateNormalDistributedPosition(Random random, int width, int height)
    {
        float centerX = width / 2.0f;
        float stdDevX = width / 6.0f;

        float normalX = GenerateNormalDistribution(random);
        int spawnX = (int)Math.Round(centerX + normalX * stdDevX);
        int spawnY = random.Next(height);

        return (spawnX, spawnY);
    }

    public static bool TryCollectPickup(ReducerContext ctx, ref Module.Tank tank, ref bool needsUpdate, Module.Pickup pickup)
    {
        if (pickup.Type == PickupType.Health)
        {
            return TryCollectHealthPickup(ctx, ref tank, ref needsUpdate, pickup, tank.MaxHealth);
        }

        if (pickup.Type == PickupType.Shield)
        {
            return TryCollectShieldPickup(ctx, ref tank, ref needsUpdate, pickup);
        }

        if (PickupToGunMap.TryGetValue(pickup.Type, out Gun gun))
        {
            return TryCollectGunPickup(ctx, ref tank, ref needsUpdate, pickup, gun);
        }

        return false;
    }

    private static bool TryCollectHealthPickup(ReducerContext ctx, ref Module.Tank tank, ref bool needsUpdate, Module.Pickup pickup, int maxHealth)
    {
        if (tank.Health < maxHealth)
        {
            tank = tank with { Health = maxHealth };
            needsUpdate = true;
            ctx.Db.pickup.Id.Delete(pickup.Id);
            return true;
        }
        return false;
    }

    private static bool TryCollectShieldPickup(ReducerContext ctx, ref Module.Tank tank, ref bool needsUpdate, Module.Pickup pickup)
    {
        if (!tank.HasShield)
        {
            tank = tank with { HasShield = true };
            needsUpdate = true;
            ctx.Db.pickup.Id.Delete(pickup.Id);
            return true;
        }
        return false;
    }

    private static bool TryCollectGunPickup(ReducerContext ctx, ref Module.Tank tank, ref bool needsUpdate, Module.Pickup pickup, Gun gunToAdd)
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
            
            if (pickup.Ammo != null)
            {
                if (existingGun.Ammo != null)
                {
                    existingGun.Ammo = existingGun.Ammo.Value + pickup.Ammo.Value;
                }
                else
                {
                    existingGun.Ammo = pickup.Ammo;
                }
                tank.Guns[existingGunIndex] = existingGun;
                needsUpdate = true;
                ctx.Db.pickup.Id.Delete(pickup.Id);
                return true;
            }
        }
        else if (tank.Guns.Length < 3)
        {
            var gunWithAmmo = pickup.Ammo.HasValue 
                ? gunToAdd with { Ammo = pickup.Ammo }
                : gunToAdd;
            
            tank = tank with
            {
                Guns = [.. tank.Guns, gunWithAmmo],
                SelectedGunIndex = tank.Guns.Length
            };
            needsUpdate = true;
            ctx.Db.pickup.Id.Delete(pickup.Id);
            return true;
        }

        return false;
    }

    public static float GenerateNormalDistribution(Random random)
    {
        double u1 = 1.0 - random.NextDouble();
        double u2 = 1.0 - random.NextDouble();
        return (float)(Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2));
    }
}
