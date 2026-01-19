using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class AdvanceTutorialOnPickup
    {
        public static void Call(ReducerContext ctx, string gameId, Tank tank, PickupType pickupType)
        {
            var game = ctx.Db.game.Id.Find(gameId);
            if (game == null || game.Value.GameType != GameType.Tutorial)
            {
                return;
            }

            if (tank.IsBot)
            {
                return;
            }

            if (pickupType == PickupType.Health)
            {
                RemoveTutorialLabel(ctx, $"{gameId}_label_health");
                SpawnTutorialWeaponPickup(ctx, gameId);
                SpawnDriveToWeaponLabel(ctx, gameId);
                Log.Info($"Tutorial {gameId}: Advanced to DriveToWeapon");
            }
            else if (pickupType == PickupType.Sniper)
            {
                RemoveTutorialLabel(ctx, $"{gameId}_label_weapon");
                var targetCode = SpawnTutorialEnemy(ctx, gameId);
                SpawnTargetEnemyLabel(ctx, gameId, targetCode);
                Log.Info($"Tutorial {gameId}: Advanced to TargetEnemy");
            }
        }

        private static void RemoveTutorialLabel(ReducerContext ctx, string labelId)
        {
            var label = ctx.Db.terrain_detail.Id.Find(labelId);
            if (label != null)
            {
                ctx.Db.terrain_detail.Id.Delete(labelId);
            }
        }

        private static void SpawnTutorialWeaponPickup(ReducerContext ctx, string gameId)
        {
            const int TUTORIAL_WEAPON_PICKUP_X = 9;
            const int TUTORIAL_WEAPON_PICKUP_Y = 9;
            const int TUTORIAL_SNIPER_AMMO = 1000;

            var gun = SNIPER_GUN with { Ammo = TUTORIAL_SNIPER_AMMO };
            var targetCode = AllocatePickupTargetCode.Call(ctx, gameId) ?? "";

            ctx.Db.pickup.Insert(Pickup.Build(
                ctx: ctx,
                gameId: gameId,
                targetCode: targetCode,
                positionX: TUTORIAL_WEAPON_PICKUP_X + 0.5f,
                positionY: TUTORIAL_WEAPON_PICKUP_Y + 0.5f,
                gridX: TUTORIAL_WEAPON_PICKUP_X,
                gridY: TUTORIAL_WEAPON_PICKUP_Y,
                type: PickupType.Sniper
            ));
        }

        private static void SpawnDriveToWeaponLabel(ReducerContext ctx, string gameId)
        {
            const int TUTORIAL_WEAPON_PICKUP_X = 9;
            const int TUTORIAL_WEAPON_PICKUP_Y = 9;

            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                id: $"{gameId}_label_weapon",
                gameId: gameId,
                positionX: TUTORIAL_WEAPON_PICKUP_X + 0.5f,
                positionY: TUTORIAL_WEAPON_PICKUP_Y - 0.3f,
                gridX: TUTORIAL_WEAPON_PICKUP_X,
                gridY: TUTORIAL_WEAPON_PICKUP_Y - 1,
                type: TerrainDetailType.Label,
                label: "Enemies are approaching! Use [color=#fceba8]`d se 3`[/color] to pick up this weapon"
            ));
        }

        private static void SpawnTargetEnemyLabel(ReducerContext ctx, string gameId, string targetCode)
        {
            const int TUTORIAL_ENEMY_SPAWN_X = 16;
            const int TUTORIAL_ENEMY_SPAWN_Y = 6;

            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                id: $"{gameId}_label_target",
                gameId: gameId,
                positionX: TUTORIAL_ENEMY_SPAWN_X + 0.5f,
                positionY: TUTORIAL_ENEMY_SPAWN_Y - 0.3f,
                gridX: TUTORIAL_ENEMY_SPAWN_X,
                gridY: TUTORIAL_ENEMY_SPAWN_Y - 1,
                type: TerrainDetailType.Label,
                label: $"Target the enemy! Use [color=#fceba8]`t {targetCode}`[/color] to lock onto them"
            ));
        }

        private static string SpawnTutorialEnemy(ReducerContext ctx, string gameId)
        {
            const int TUTORIAL_ENEMY_SPAWN_X = 16;
            const int TUTORIAL_ENEMY_SPAWN_Y = 6;

            var targetCode = AllocateTargetCode.Call(ctx, gameId) ?? "e1";
            var botName = "Target Dummy";

            var (enemyTank, enemyTransform) = BuildTank(
                ctx: ctx,
                id: $"{gameId}_enemy",
                gameId: gameId,
                owner: Identity.From(new byte[32]),
                name: botName,
                targetCode: targetCode,
                joinCode: "",
                alliance: 1,
                positionX: TUTORIAL_ENEMY_SPAWN_X + 0.5f,
                positionY: TUTORIAL_ENEMY_SPAWN_Y + 0.5f,
                aiBehavior: AIBehavior.None);

            ctx.Db.tank.Insert(enemyTank);
            ctx.Db.tank_transform.Insert(enemyTransform);

            return targetCode;
        }
    }
}
