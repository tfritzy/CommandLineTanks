using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;

public static partial class PickupSpawner
{
    private const float POSITION_COLLISION_THRESHOLD_SQUARED = 0.01f;

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

        if (game.Value.GameType == GameType.Home)
        {
            SpawnHomegamePickups(ctx, args.GameId);
        }
        else if (game.Value.GameType == GameType.Tutorial)
        {
            return;
        }
        else
        {
            var existingPickups = ctx.Db.pickup.GameId.Filter(args.GameId);
            int regularPickupCount = 0;
            int healthPackCount = 0;
            foreach (var pickup in existingPickups)
            {
                if (pickup.Type == PickupType.Health)
                {
                    healthPackCount++;
                }
                else
                {
                    regularPickupCount++;
                }
            }

            var traversibilityMap = ctx.Db.traversibility_map.GameId.Find(args.GameId);
            if (traversibilityMap == null) return;

            bool spawnedSomething = false;

            if (regularPickupCount < 15)
            {
                int maxAttempts = 100;
                for (int attempt = 0; attempt < maxAttempts; attempt++)
                {
                    if (TrySpawnRegularPickup(ctx, args.GameId, traversibilityMap.Value))
                    {
                        spawnedSomething = true;
                        break;
                    }
                }
            }

            if (!spawnedSomething && healthPackCount < 15)
            {
                int maxAttempts = 100;
                for (int attempt = 0; attempt < maxAttempts; attempt++)
                {
                    if (TrySpawnHealthPack(ctx, args.GameId, traversibilityMap.Value))
                    {
                        break;
                    }
                }
            }
        }
    }

    public static void SpawnHomegamePickups(ReducerContext ctx, string gameId)
    {
        foreach (var pickupType in HOMEGAME_PICKUP_TYPES)
        {
            var (gridX, gridY) = GetHomegamePickupPosition(pickupType);

            if (gridX < 0 || gridY < 0)
            {
                continue;
            }

            var existingPickup = ctx.Db.pickup.GameId_GridX_GridY.Filter((gameId, gridX, gridY));

            if (existingPickup.Any())
            {
                continue;
            }

            Module.SpawnPickupWithDestination.Call(
                ctx: ctx,
                gameId: gameId,
                positionX: gridX + 0.5f,
                positionY: gridY + 0.5f,
                gridX: gridX,
                gridY: gridY,
                pickupType: pickupType,
                ammo: GetAmmoForPickupType(pickupType)
            );
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

        int regularSpawnedCount = 0;
        int healthSpawnedCount = 0;
        int maxAttempts = 500;

        for (int attempt = 0; attempt < maxAttempts && regularSpawnedCount < initialPickupCount; attempt++)
        {
            if (TrySpawnRegularPickup(ctx, gameId, traversibilityMap.Value))
            {
                regularSpawnedCount++;
            }
        }

        for (int attempt = 0; attempt < maxAttempts && healthSpawnedCount < initialPickupCount; attempt++)
        {
            if (TrySpawnHealthPack(ctx, gameId, traversibilityMap.Value))
            {
                healthSpawnedCount++;
            }
        }
    }

    public static bool TrySpawnRegularPickup(ReducerContext ctx, string gameId, Module.TraversibilityMap traversibilityMap)
    {
        var (spawnX, spawnY) = GenerateNormalDistributedPosition(
            ctx.Rng,
            traversibilityMap.Width,
            traversibilityMap.Height
        );

        if (spawnX < 0 || spawnX >= traversibilityMap.Width || spawnY < 0 || spawnY >= traversibilityMap.Height)
            return false;

        int tileIndex = spawnY * traversibilityMap.Width + spawnX;
        if (tileIndex >= traversibilityMap.Map.Length * 8 || !traversibilityMap.IsTraversable(tileIndex))
            return false;

        float centerX = spawnX + 0.5f;
        float centerY = spawnY + 0.5f;

        var existingDetail = ctx.Db.terrain_detail.GameId_GridX_GridY.Filter((gameId, spawnX, spawnY));
        foreach (var detail in existingDetail)
        {
            return false;
        }

        var existingPickup = ctx.Db.pickup.GameId_GridX_GridY.Filter((gameId, spawnX, spawnY));
        foreach (var p in existingPickup)
        {
            return false;
        }

        if (IsAnchorAtPosition(ctx, gameId, centerX, centerY))
        {
            return false;
        }

        int pickupTypeIndex = ctx.Rng.Next(NON_HEALTH_PICKUP_TYPES.Length);
        PickupType pickupType = NON_HEALTH_PICKUP_TYPES[pickupTypeIndex];

        Module.SpawnPickupWithDestination.Call(
            ctx: ctx,
            gameId: gameId,
            positionX: centerX,
            positionY: centerY,
            gridX: spawnX,
            gridY: spawnY,
            pickupType: pickupType,
            ammo: GetAmmoForPickupType(pickupType)
        );

        return true;
    }

    public static bool TrySpawnHealthPack(ReducerContext ctx, string gameId, Module.TraversibilityMap traversibilityMap)
    {
        var (spawnX, spawnY) = GenerateEdgeDistributedPosition(
            ctx.Rng,
            traversibilityMap.Width,
            traversibilityMap.Height
        );

        if (spawnX < 0 || spawnX >= traversibilityMap.Width || spawnY < 0 || spawnY >= traversibilityMap.Height)
            return false;

        int tileIndex = spawnY * traversibilityMap.Width + spawnX;
        if (tileIndex >= traversibilityMap.Map.Length * 8 || !traversibilityMap.IsTraversable(tileIndex))
            return false;

        float centerX = spawnX + 0.5f;
        float centerY = spawnY + 0.5f;

        var existingDetail = ctx.Db.terrain_detail.GameId_GridX_GridY.Filter((gameId, spawnX, spawnY));
        foreach (var detail in existingDetail)
        {
            return false;
        }

        var existingPickup = ctx.Db.pickup.GameId_GridX_GridY.Filter((gameId, spawnX, spawnY));
        foreach (var p in existingPickup)
        {
            return false;
        }

        if (IsAnchorAtPosition(ctx, gameId, centerX, centerY))
        {
            return false;
        }

        Module.SpawnPickupWithDestination.Call(
            ctx: ctx,
            gameId: gameId,
            positionX: centerX,
            positionY: centerY,
            gridX: spawnX,
            gridY: spawnY,
            pickupType: PickupType.Health,
            ammo: null
        );

        return true;
    }

    public static int GetHomegamePickupRow()
    {
        return Module.HOMEGAME_HEIGHT / 2 + 5;
    }

    public static (int gridX, int gridY) GetHomegamePickupPosition(PickupType pickupType)
    {
        int index = Array.IndexOf(HOMEGAME_PICKUP_TYPES, pickupType);

        if (index < 0)
        {
            return (-1, -1);
        }

        int pickupCount = HOMEGAME_PICKUP_TYPES.Length;
        int startX = (Module.HOMEGAME_WIDTH - pickupCount * 2) / 2;
        int gridX = startX + (index * 2);
        int gridY = GetHomegamePickupRow();
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

    public static (int x, int y) GenerateEdgeDistributedPosition(Random random, int width, int height)
    {
        bool spawnOnLeftSide = random.NextDouble() < 0.5;
        
        int edgeThreshold = (int)(width * 0.35);
        
        int spawnX;
        if (spawnOnLeftSide)
        {
            spawnX = random.Next(edgeThreshold);
        }
        else
        {
            spawnX = width - edgeThreshold + random.Next(edgeThreshold);
        }
        
        int spawnY = random.Next(height);
        
        return (spawnX, spawnY);
    }

    public static bool TryCollectPickup(ReducerContext ctx, ref Module.Tank tank, ref bool needsUpdate, Module.Pickup pickup)
    {
        bool collected = false;

        if (pickup.Type == PickupType.Health)
        {
            collected = TryCollectHealthPickup(ctx, ref tank, ref needsUpdate, pickup, tank.MaxHealth);
        }
        else if (pickup.Type == PickupType.Shield)
        {
            collected = TryCollectShieldPickup(ctx, ref tank, ref needsUpdate, pickup);
        }
        else if (PickupToGunMap.TryGetValue(pickup.Type, out Gun gun))
        {
            collected = TryCollectGunPickup(ctx, ref tank, ref needsUpdate, pickup, gun);
        }

        if (collected)
        {
            Module.AdvanceTutorialOnPickup.Call(ctx, tank.GameId, tank, pickup.Type);
        }

        return collected;
    }

    private static bool TryCollectHealthPickup(ReducerContext ctx, ref Module.Tank tank, ref bool needsUpdate, Module.Pickup pickup, int maxHealth)
    {
        if (tank.Health < maxHealth)
        {
            tank = tank with { Health = maxHealth };
            needsUpdate = true;
            ctx.Db.pickup.Id.Delete(pickup.Id);
            DeleteDestinationAtPosition(ctx, pickup.GameId, pickup.PositionX, pickup.PositionY);
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
            DeleteDestinationAtPosition(ctx, pickup.GameId, pickup.PositionX, pickup.PositionY);
            return true;
        }
        return false;
    }

    private static bool TryCollectGunPickup(ReducerContext ctx, ref Module.Tank tank, ref bool needsUpdate, Module.Pickup pickup, Gun gunToAdd)
    {
        Module.TankGun? existingGunEntry = null;
        int storedGunCount = 0;
        foreach (var g in ctx.Db.tank_gun.TankId.Filter(tank.Id))
        {
            storedGunCount++;
            if (g.Gun.GunType == gunToAdd.GunType)
            {
                existingGunEntry = g;
            }
        }

        if (existingGunEntry != null)
        {
            var existingGun = existingGunEntry.Value.Gun;

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
                ctx.Db.tank_gun.Id.Update(existingGunEntry.Value with { Gun = existingGun });
                ctx.Db.pickup.Id.Delete(pickup.Id);
                DeleteDestinationAtPosition(ctx, pickup.GameId, pickup.PositionX, pickup.PositionY);
                return true;
            }
        }
        else if (storedGunCount < 2)
        {
            var gunWithAmmo = pickup.Ammo.HasValue
                ? gunToAdd with { Ammo = pickup.Ammo }
                : gunToAdd;

            int newSlotIndex = storedGunCount + 1;
            ctx.Db.tank_gun.Insert(new Module.TankGun
            {
                TankId = tank.Id,
                GameId = tank.GameId,
                SlotIndex = newSlotIndex,
                Gun = gunWithAmmo
            });
            tank = tank with { SelectedGunIndex = newSlotIndex };
            needsUpdate = true;
            ctx.Db.pickup.Id.Delete(pickup.Id);
            DeleteDestinationAtPosition(ctx, pickup.GameId, pickup.PositionX, pickup.PositionY);
            return true;
        }

        return false;
    }

    private static void DeleteDestinationAtPosition(ReducerContext ctx, string gameId, float positionX, float positionY)
    {
        foreach (var destination in ctx.Db.destination.GameId.Filter(gameId))
        {
            float dx = destination.PositionX - positionX;
            float dy = destination.PositionY - positionY;
            if (dx * dx + dy * dy < POSITION_COLLISION_THRESHOLD_SQUARED && destination.Type == DestinationType.Pickup)
            {
                ctx.Db.destination.Id.Delete(destination.Id);
                return;
            }
        }
    }

    private static bool IsAnchorAtPosition(ReducerContext ctx, string gameId, float positionX, float positionY)
    {
        foreach (var destination in ctx.Db.destination.GameId.Filter(gameId))
        {
            if (destination.Type != DestinationType.Anchor)
                continue;

            float dx = destination.PositionX - positionX;
            float dy = destination.PositionY - positionY;
            if (dx * dx + dy * dy < POSITION_COLLISION_THRESHOLD_SQUARED)
            {
                return true;
            }
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
