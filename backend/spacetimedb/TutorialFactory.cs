using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int TUTORIAL_WIDTH = 20;
    private const int TUTORIAL_HEIGHT = 12;
    private const int TUTORIAL_STARTING_HEALTH = 30;
    private const int TUTORIAL_SNIPER_AMMO = 1000;

    private static readonly (int x, int y) TUTORIAL_PLAYER_SPAWN = (3, 6);
    private static readonly (int x, int y) TUTORIAL_HEALTH_PICKUP = (6, 3);
    private static readonly (int x, int y) TUTORIAL_WEAPON_PICKUP = (9, 6);
    private static readonly (int x, int y) TUTORIAL_ENEMY_SPAWN = (16, 6);

    public static string GetTutorialGameId(Identity identity)
    {
        return $"tutorial_{identity.ToString().ToLower()}";
    }

    public static void EnsureTutorialGame(ReducerContext ctx, Identity identity, string joinCode)
    {
        var tutorialGameId = GetTutorialGameId(identity);

        var existingGame = ctx.Db.game.Id.Find(tutorialGameId);
        if (existingGame == null)
        {
            CreateTutorialGame(ctx, identity, joinCode);
        }
        else
        {
            EnsureTankInTutorial(ctx, tutorialGameId, identity, joinCode);
        }
    }

    private static void EnsureTankInTutorial(ReducerContext ctx, string gameId, Identity owner, string joinCode)
    {
        var existingTank = ctx.Db.tank.GameId_Owner.Filter((gameId, owner)).FirstOrDefault();
        if (existingTank.Id != null)
        {
            return;
        }

        var player = ctx.Db.player.Identity.Find(owner);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var targetCode = AllocateTargetCode(ctx, gameId) ?? "p1";

        var (tank, transform) = BuildTank(
            ctx: ctx,
            gameId: gameId,
            owner: owner,
            name: playerName,
            targetCode: targetCode,
            joinCode: joinCode,
            alliance: 0,
            health: TUTORIAL_STARTING_HEALTH,
            positionX: TUTORIAL_PLAYER_SPAWN.x + 0.5f,
            positionY: TUTORIAL_PLAYER_SPAWN.y + 0.5f,
            aiBehavior: AIBehavior.None);

        AddTankToGame(ctx, tank, transform);
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

        for (int i = 0; i < totalTiles; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
        }

        var game = new Game
        {
            Id = tutorialGameId,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = TUTORIAL_WIDTH,
            Height = TUTORIAL_HEIGHT,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
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

        InsertTraversibilityMapsForEmptyTerrain(ctx, tutorialGameId, TUTORIAL_WIDTH, TUTORIAL_HEIGHT);

        ctx.Db.score.Insert(new Score
        {
            GameId = tutorialGameId,
            Kills = new int[] { 0, 0 }
        });

        SpawnTutorialHealthPickup(ctx, tutorialGameId);
        SpawnDriveToHealthLabel(ctx, tutorialGameId);

        EnsureTankInTutorial(ctx, tutorialGameId, identity, joinCode);

        StartHomeGameTickers(ctx, tutorialGameId);

        Log.Info($"Created tutorial game {tutorialGameId} for identity {identity}");
    }

    public static void InsertTraversibilityMapsForEmptyTerrain(ReducerContext ctx, string gameId, int width, int height)
    {
        int totalTiles = width * height;
        var traversibilityBoolMap = new bool[totalTiles];
        var projectileTraversibilityBoolMap = new bool[totalTiles];

        for (int i = 0; i < totalTiles; i++)
        {
            traversibilityBoolMap[i] = true;
            projectileTraversibilityBoolMap[i] = true;
        }

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            GameId = gameId,
            Map = BitPackingUtils.BoolArrayToByteArray(traversibilityBoolMap),
            Width = width,
            Height = height
        });

        ctx.Db.projectile_traversibility_map.Insert(new ProjectileTraversibilityMap
        {
            GameId = gameId,
            Map = BitPackingUtils.BoolArrayToByteArray(projectileTraversibilityBoolMap),
            Width = width,
            Height = height
        });
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
            ammo: TUTORIAL_SNIPER_AMMO
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

    public static void MaybeAdvanceTutorialOnPickup(ReducerContext ctx, string gameId, Tank tank, PickupType pickupType)
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

    public static void MaybeAdvanceTutorialOnTarget(ReducerContext ctx, string gameId, Tank playerTank)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null || game.Value.GameType != GameType.Tutorial)
        {
            return;
        }

        var targetLabel = ctx.Db.terrain_detail.Id.Find($"{gameId}_label_target");
        if (targetLabel == null)
        {
            return;
        }

        if (playerTank.Target == $"{gameId}_enemy")
        {
            RemoveTutorialLabel(ctx, $"{gameId}_label_target");
            SpawnFireLabel(ctx, gameId);
            Log.Info($"Tutorial {gameId}: Advanced to KillEnemy");
        }
    }

    public static void MaybeAdvanceTutorialOnKill(ReducerContext ctx, string gameId, Tank killedTank)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null || game.Value.GameType != GameType.Tutorial)
        {
            return;
        }

        if (killedTank.Id == $"{gameId}_enemy")
        {
            RemoveTutorialLabel(ctx, $"{gameId}_label_fire");
            SpawnCompletionLabel(ctx, gameId);
            Log.Info($"Tutorial {gameId}: Complete!");
        }
    }

    public static void CompleteTutorial(ReducerContext ctx, Identity identity)
    {
        var player = ctx.Db.player.Identity.Find(identity);
        if (player != null)
        {
            ctx.Db.player.Identity.Update(player.Value with { TutorialComplete = true });
        }

        var tutorialGameId = GetTutorialGameId(identity);
        var game = ctx.Db.game.Id.Find(tutorialGameId);
        if (game != null)
        {
            DeleteGame(ctx, tutorialGameId);
        }
    }
}
