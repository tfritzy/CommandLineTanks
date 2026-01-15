using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int TUTORIAL_WIDTH = 20;
    private const int TUTORIAL_HEIGHT = 12;
    private const int TUTORIAL_STARTING_HEALTH = 30;

    private static readonly (int x, int y) TUTORIAL_PLAYER_SPAWN = (3, 6);
    private static readonly (int x, int y) TUTORIAL_HEALTH_PICKUP = (6, 3);
    private static readonly (int x, int y) TUTORIAL_WEAPON_PICKUP = (9, 6);
    private static readonly (int x, int y) TUTORIAL_ENEMY_SPAWN = (16, 6);

    public static string GetTutorialGameId(Identity identity)
    {
        var identityString = identity.ToString().ToLower();
        var truncatedId = identityString.Length >= 16 ? identityString.Substring(0, 16) : identityString;
        return $"tutorial/{truncatedId}";
    }

    public static bool ShouldShowTutorial(ReducerContext ctx, Identity identity)
    {
        var player = ctx.Db.player.Identity.Find(identity);
        if (player == null) return true;

        foreach (var game in ctx.Db.game.GameType.Filter(GameType.Tutorial))
        {
            if (game.Owner.HasValue && game.Owner.Value.Equals(identity))
            {
                return true;
            }
        }

        foreach (var game in ctx.Db.game.Iter())
        {
            if (game.GameType != GameType.Tutorial)
            {
                foreach (var tank in ctx.Db.tank.GameId.Filter(game.Id))
                {
                    if (tank.Owner.Equals(identity) && !tank.IsBot)
                    {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    public static void CreateTutorialGame(ReducerContext ctx, Identity identity, string joinCode)
    {
        var tutorialGameId = GetTutorialGameId(identity);

        var existingGame = ctx.Db.game.Id.Find(tutorialGameId);
        if (existingGame != null)
        {
            DeleteTutorialGame(ctx, tutorialGameId);
        }

        int totalTiles = TUTORIAL_WIDTH * TUTORIAL_HEIGHT;
        var baseTerrain = new BaseTerrain[totalTiles];
        var traversibilityBoolMap = new bool[totalTiles];
        var projectileTraversibilityBoolMap = new bool[totalTiles];

        for (int i = 0; i < totalTiles; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
            traversibilityBoolMap[i] = true;
            projectileTraversibilityBoolMap[i] = true;
        }

        var game = new Game
        {
            Id = tutorialGameId,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = TUTORIAL_WIDTH,
            Height = TUTORIAL_HEIGHT,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
            IsHomeGame = false,
            GameType = GameType.Tutorial,
            GameStartedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            GameDurationMicros = 0,
            Visibility = GameVisibility.Private,
            MaxPlayers = 1,
            CurrentPlayerCount = 0,
            BotCount = 0,
            Owner = identity
        };

        ctx.Db.game.Insert(game);

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            GameId = tutorialGameId,
            Map = BitPackingUtils.BoolArrayToByteArray(traversibilityBoolMap),
            Width = TUTORIAL_WIDTH,
            Height = TUTORIAL_HEIGHT
        });

        ctx.Db.projectile_traversibility_map.Insert(new ProjectileTraversibilityMap
        {
            GameId = tutorialGameId,
            Map = BitPackingUtils.BoolArrayToByteArray(projectileTraversibilityBoolMap),
            Width = TUTORIAL_WIDTH,
            Height = TUTORIAL_HEIGHT
        });

        ctx.Db.score.Insert(new Score
        {
            GameId = tutorialGameId,
            Kills = new int[] { 0, 0 }
        });

        ctx.Db.tutorial_progress.Insert(new TutorialProgress
        {
            GameId = tutorialGameId,
            State = TutorialState.DriveToHealth,
            TargetTankId = null
        });

        SpawnTutorialHealthPickup(ctx, tutorialGameId);
        SpawnDriveToHealthLabel(ctx, tutorialGameId);
        SpawnSkipTutorialLabel(ctx, tutorialGameId);

        var player = ctx.Db.player.Identity.Find(identity);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var targetCode = AllocateTargetCode(ctx, tutorialGameId) ?? "p1";

        var (tank, transform) = BuildTank(
            ctx: ctx,
            gameId: tutorialGameId,
            owner: identity,
            name: playerName,
            targetCode: targetCode,
            joinCode: joinCode,
            alliance: 0,
            health: TUTORIAL_STARTING_HEALTH,
            positionX: TUTORIAL_PLAYER_SPAWN.x + 0.5f,
            positionY: TUTORIAL_PLAYER_SPAWN.y + 0.5f,
            aiBehavior: AIBehavior.None);

        AddTankToGame(ctx, tank, transform);

        StartGameTickers(ctx, tutorialGameId);

        Log.Info($"Created tutorial game {tutorialGameId} for identity {identity}");
    }

    private static void SpawnTutorialHealthPickup(ReducerContext ctx, string gameId)
    {
        ctx.Db.pickup.Insert(Pickup.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: TUTORIAL_HEALTH_PICKUP.x + 0.5f,
            positionY: TUTORIAL_HEALTH_PICKUP.y + 0.5f,
            gridX: TUTORIAL_HEALTH_PICKUP.x,
            gridY: TUTORIAL_HEALTH_PICKUP.y,
            type: PickupType.Health
        ));
    }

    private static void SpawnTutorialWeaponPickup(ReducerContext ctx, string gameId)
    {
        ctx.Db.pickup.Insert(Pickup.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: TUTORIAL_WEAPON_PICKUP.x + 0.5f,
            positionY: TUTORIAL_WEAPON_PICKUP.y + 0.5f,
            gridX: TUTORIAL_WEAPON_PICKUP.x,
            gridY: TUTORIAL_WEAPON_PICKUP.y,
            type: PickupType.Sniper,
            ammo: SNIPER_GUN.Ammo
        ));
    }

    private static void SpawnDriveToHealthLabel(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_label_health",
            gameId: gameId,
            positionX: TUTORIAL_HEALTH_PICKUP.x + 0.5f,
            positionY: TUTORIAL_HEALTH_PICKUP.y - 0.3f,
            gridX: TUTORIAL_HEALTH_PICKUP.x,
            gridY: TUTORIAL_HEALTH_PICKUP.y - 1,
            type: TerrainDetailType.Label,
            label: "You're low on health! Use [color=#fceba8]`drive northeast 3`[/color] to pick up this health pack"
        ));
    }

    private static void SpawnDriveToWeaponLabel(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_label_weapon",
            gameId: gameId,
            positionX: TUTORIAL_WEAPON_PICKUP.x + 0.5f,
            positionY: TUTORIAL_WEAPON_PICKUP.y - 0.3f,
            gridX: TUTORIAL_WEAPON_PICKUP.x,
            gridY: TUTORIAL_WEAPON_PICKUP.y - 1,
            type: TerrainDetailType.Label,
            label: "Enemies are approaching! Use [color=#fceba8]`d se 3`[/color] to pick up this weapon"
        ));
    }

    private static void SpawnTargetEnemyLabel(ReducerContext ctx, string gameId, string targetCode)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_label_target",
            gameId: gameId,
            positionX: TUTORIAL_ENEMY_SPAWN.x + 0.5f,
            positionY: TUTORIAL_ENEMY_SPAWN.y - 0.3f,
            gridX: TUTORIAL_ENEMY_SPAWN.x,
            gridY: TUTORIAL_ENEMY_SPAWN.y - 1,
            type: TerrainDetailType.Label,
            label: $"Target the enemy! Use [color=#fceba8]`t {targetCode}`[/color] to lock onto them"
        ));
    }

    private static void SpawnFireLabel(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_label_fire",
            gameId: gameId,
            positionX: TUTORIAL_ENEMY_SPAWN.x + 0.5f,
            positionY: TUTORIAL_ENEMY_SPAWN.y - 0.3f,
            gridX: TUTORIAL_ENEMY_SPAWN.x,
            gridY: TUTORIAL_ENEMY_SPAWN.y - 1,
            type: TerrainDetailType.Label,
            label: "Now fire! Use [color=#fceba8]`f`[/color] repeatedly to destroy them"
        ));
    }

    private static void SpawnCompletionLabel(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_label_complete",
            gameId: gameId,
            positionX: TUTORIAL_WIDTH / 2.0f,
            positionY: TUTORIAL_HEIGHT / 2.0f - 1,
            gridX: TUTORIAL_WIDTH / 2,
            gridY: TUTORIAL_HEIGHT / 2 - 1,
            type: TerrainDetailType.Label,
            label: "Tutorial complete! Use [color=#fceba8]`tutorial complete`[/color] to start playing"
        ));
    }

    private static void SpawnSkipTutorialLabel(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_label_skip",
            gameId: gameId,
            positionX: TUTORIAL_WIDTH / 2.0f,
            positionY: TUTORIAL_HEIGHT - 1.0f,
            gridX: TUTORIAL_WIDTH / 2,
            gridY: TUTORIAL_HEIGHT - 1,
            type: TerrainDetailType.Label,
            label: "[color=#707b89]Use `tutorial skip` to skip the tutorial[/color]"
        ));
    }

    private static string SpawnTutorialEnemy(ReducerContext ctx, string gameId)
    {
        var targetCode = AllocateTargetCode(ctx, gameId) ?? "e1";
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
            health: 60,
            maxHealth: 60,
            positionX: TUTORIAL_ENEMY_SPAWN.x + 0.5f,
            positionY: TUTORIAL_ENEMY_SPAWN.y + 0.5f,
            aiBehavior: AIBehavior.None);

        ctx.Db.tank.Insert(enemyTank);
        ctx.Db.tank_transform.Insert(enemyTransform);

        return targetCode;
    }

    private static void RemoveTutorialLabel(ReducerContext ctx, string labelId)
    {
        var label = ctx.Db.terrain_detail.Id.Find(labelId);
        if (label != null)
        {
            ctx.Db.terrain_detail.Id.Delete(labelId);
        }
    }

    public static void MaybeAdvanceTutorial(ReducerContext ctx, string gameId)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null || game.Value.GameType != GameType.Tutorial)
        {
            return;
        }

        var progress = ctx.Db.tutorial_progress.GameId.Find(gameId);
        if (progress == null)
        {
            return;
        }

        var currentState = progress.Value.State;

        switch (currentState)
        {
            case TutorialState.DriveToHealth:
                MaybeAdvanceFromDriveToHealth(ctx, gameId);
                break;
            case TutorialState.DriveToWeapon:
                MaybeAdvanceFromDriveToWeapon(ctx, gameId);
                break;
            case TutorialState.TargetEnemy:
                break;
            case TutorialState.KillEnemy:
                MaybeAdvanceFromKillEnemy(ctx, gameId);
                break;
            case TutorialState.Complete:
                break;
        }
    }

    private static void MaybeAdvanceFromDriveToHealth(ReducerContext ctx, string gameId)
    {
        Tank? playerTank = null;
        foreach (var tank in ctx.Db.tank.GameId.Filter(gameId))
        {
            if (!tank.IsBot && tank.AIBehavior == AIBehavior.None)
            {
                playerTank = tank;
                break;
            }
        }

        if (playerTank == null) return;

        if (playerTank.Value.Health >= playerTank.Value.MaxHealth)
        {
            RemoveTutorialLabel(ctx, $"{gameId}_label_health");

            SpawnTutorialWeaponPickup(ctx, gameId);
            SpawnDriveToWeaponLabel(ctx, gameId);

            ctx.Db.tutorial_progress.GameId.Update(new TutorialProgress
            {
                GameId = gameId,
                State = TutorialState.DriveToWeapon,
                TargetTankId = null
            });

            Log.Info($"Tutorial {gameId}: Advanced to DriveToWeapon");
        }
    }

    private static void MaybeAdvanceFromDriveToWeapon(ReducerContext ctx, string gameId)
    {
        Tank? playerTank = null;
        foreach (var tank in ctx.Db.tank.GameId.Filter(gameId))
        {
            if (!tank.IsBot && tank.AIBehavior == AIBehavior.None)
            {
                playerTank = tank;
                break;
            }
        }

        if (playerTank == null) return;

        bool hasSniperGun = false;
        foreach (var gun in ctx.Db.tank_gun.TankId.Filter(playerTank.Value.Id))
        {
            if (gun.Gun.GunType == GunType.Sniper)
            {
                hasSniperGun = true;
                break;
            }
        }

        if (hasSniperGun)
        {
            RemoveTutorialLabel(ctx, $"{gameId}_label_weapon");

            var targetCode = SpawnTutorialEnemy(ctx, gameId);
            SpawnTargetEnemyLabel(ctx, gameId, targetCode);

            ctx.Db.tutorial_progress.GameId.Update(new TutorialProgress
            {
                GameId = gameId,
                State = TutorialState.TargetEnemy,
                TargetTankId = $"{gameId}_enemy"
            });

            Log.Info($"Tutorial {gameId}: Advanced to TargetEnemy");
        }
    }

    public static void MaybeAdvanceFromTargetEnemy(ReducerContext ctx, string gameId, Tank playerTank)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null || game.Value.GameType != GameType.Tutorial)
        {
            return;
        }

        var progress = ctx.Db.tutorial_progress.GameId.Find(gameId);
        if (progress == null || progress.Value.State != TutorialState.TargetEnemy)
        {
            return;
        }

        if (playerTank.Target == progress.Value.TargetTankId)
        {
            RemoveTutorialLabel(ctx, $"{gameId}_label_target");
            SpawnFireLabel(ctx, gameId);

            ctx.Db.tutorial_progress.GameId.Update(new TutorialProgress
            {
                GameId = gameId,
                State = TutorialState.KillEnemy,
                TargetTankId = progress.Value.TargetTankId
            });

            Log.Info($"Tutorial {gameId}: Advanced to KillEnemy");
        }
    }

    private static void MaybeAdvanceFromKillEnemy(ReducerContext ctx, string gameId)
    {
        var progress = ctx.Db.tutorial_progress.GameId.Find(gameId);
        if (progress == null) return;

        var enemyTank = ctx.Db.tank.Id.Find(progress.Value.TargetTankId ?? "");
        if (enemyTank == null || enemyTank.Value.Health <= 0)
        {
            RemoveTutorialLabel(ctx, $"{gameId}_label_fire");
            SpawnCompletionLabel(ctx, gameId);

            ctx.Db.tutorial_progress.GameId.Update(new TutorialProgress
            {
                GameId = gameId,
                State = TutorialState.Complete,
                TargetTankId = null
            });

            Log.Info($"Tutorial {gameId}: Complete!");
        }
    }

    public static void DeleteTutorialGame(ReducerContext ctx, string gameId)
    {
        foreach (var tank in ctx.Db.tank.GameId.Filter(gameId))
        {
            RemoveTankFromGame(ctx, tank);
        }

        foreach (var terrainDetail in ctx.Db.terrain_detail.GameId.Filter(gameId))
        {
            ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);
        }

        foreach (var pickup in ctx.Db.pickup.GameId.Filter(gameId))
        {
            ctx.Db.pickup.Id.Delete(pickup.Id);
        }

        foreach (var projectile in ctx.Db.projectile.GameId.Filter(gameId))
        {
            ctx.Db.projectile_transform.ProjectileId.Delete(projectile.Id);
            ctx.Db.projectile.Id.Delete(projectile.Id);
        }

        var score = ctx.Db.score.GameId.Find(gameId);
        if (score != null)
        {
            ctx.Db.score.GameId.Delete(gameId);
        }

        var traversibilityMap = ctx.Db.traversibility_map.GameId.Find(gameId);
        if (traversibilityMap != null)
        {
            ctx.Db.traversibility_map.GameId.Delete(gameId);
        }

        var projectileTraversibilityMap = ctx.Db.projectile_traversibility_map.GameId.Find(gameId);
        if (projectileTraversibilityMap != null)
        {
            ctx.Db.projectile_traversibility_map.GameId.Delete(gameId);
        }

        var tutorialProgress = ctx.Db.tutorial_progress.GameId.Find(gameId);
        if (tutorialProgress != null)
        {
            ctx.Db.tutorial_progress.GameId.Delete(gameId);
        }

        StopGameTickers(ctx, gameId);

        var gameToDelete = ctx.Db.game.Id.Find(gameId);
        if (gameToDelete != null)
        {
            ctx.Db.game.Id.Delete(gameId);
        }

        Log.Info($"Deleted tutorial game {gameId}");
    }
}
