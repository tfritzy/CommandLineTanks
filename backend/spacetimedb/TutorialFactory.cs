using SpacetimeDB;
using static Types;
using System;
using System.Linq;

public static partial class Module
{
    private const int TUTORIAL_WIDTH = 20;
    private const int TUTORIAL_HEIGHT = 12;
    private const int TUTORIAL_STARTING_HEALTH = 30;
    private const int TUTORIAL_SNIPER_AMMO = 1000;
    private const int LESSON_LABEL_Y_POSITION = 2;

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
            DeleteGame(ctx, tutorialGameId);
        }

        int totalTiles = TUTORIAL_WIDTH * TUTORIAL_HEIGHT;
        var baseTerrain = new BaseTerrain[totalTiles];

        for (int i = 0; i < totalTiles; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
        }

        AddTutorialDecorations(baseTerrain, TUTORIAL_WIDTH, TUTORIAL_HEIGHT);

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

        var traversibilityBoolMap = CalculateTutorialTraversibility(baseTerrain);
        var projectileTraversibilityBoolMap = CalculateTutorialProjectileTraversibility(baseTerrain);

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

        AddTutorialTerrainDetails(ctx, tutorialGameId);

        SpawnTutorialHealthPickup(ctx, tutorialGameId);
        SpawnLesson1Label(ctx, tutorialGameId);
        SpawnDriveToHealthLabel(ctx, tutorialGameId);

        EnsureTankInTutorial(ctx, tutorialGameId, identity, joinCode);

        StartHomeGameTickers(ctx, tutorialGameId);

        Log.Info($"Created tutorial game {tutorialGameId} for identity {identity}");
    }

    private static void AddTutorialDecorations(BaseTerrain[] baseTerrain, int width, int height)
    {
        baseTerrain[0 * width + 1] = BaseTerrain.Water;
        baseTerrain[0 * width + 2] = BaseTerrain.Water;
        baseTerrain[1 * width + 0] = BaseTerrain.Water;
        baseTerrain[1 * width + 1] = BaseTerrain.Water;
        baseTerrain[1 * width + 2] = BaseTerrain.Water;
        baseTerrain[2 * width + 0] = BaseTerrain.Water;
        baseTerrain[2 * width + 1] = BaseTerrain.Water;

        baseTerrain[0 * width + 17] = BaseTerrain.Water;
        baseTerrain[0 * width + 18] = BaseTerrain.Water;
        baseTerrain[1 * width + 17] = BaseTerrain.Water;
        baseTerrain[1 * width + 18] = BaseTerrain.Water;
        baseTerrain[1 * width + 19] = BaseTerrain.Water;
        baseTerrain[2 * width + 18] = BaseTerrain.Water;
        baseTerrain[2 * width + 19] = BaseTerrain.Water;

        baseTerrain[9 * width + 0] = BaseTerrain.Water;
        baseTerrain[9 * width + 1] = BaseTerrain.Water;
        baseTerrain[10 * width + 0] = BaseTerrain.Water;
        baseTerrain[10 * width + 1] = BaseTerrain.Water;
        baseTerrain[11 * width + 0] = BaseTerrain.Water;
        baseTerrain[11 * width + 1] = BaseTerrain.Water;

        baseTerrain[10 * width + 18] = BaseTerrain.Water;
        baseTerrain[10 * width + 19] = BaseTerrain.Water;
        baseTerrain[11 * width + 18] = BaseTerrain.Water;
        baseTerrain[11 * width + 19] = BaseTerrain.Water;
    }

    private static void AddTutorialTerrainDetails(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 0.5f,
            positionY: 5.5f,
            gridX: 0,
            gridY: 5,
            type: TerrainDetailType.Rock,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 19.5f,
            positionY: 1.5f,
            gridX: 19,
            gridY: 1,
            type: TerrainDetailType.Rock,
            rotation: 1
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 19.5f,
            positionY: 10.5f,
            gridX: 19,
            gridY: 10,
            type: TerrainDetailType.Rock,
            rotation: 2
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 1.5f,
            positionY: 11.5f,
            gridX: 1,
            gridY: 11,
            type: TerrainDetailType.Tree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 18.5f,
            positionY: 11.5f,
            gridX: 18,
            gridY: 11,
            type: TerrainDetailType.Tree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 10.5f,
            positionY: 0.5f,
            gridX: 10,
            gridY: 0,
            type: TerrainDetailType.DeadTree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 0.5f,
            positionY: 8.5f,
            gridX: 0,
            gridY: 8,
            type: TerrainDetailType.DeadTree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 19.5f,
            positionY: 4.5f,
            gridX: 19,
            gridY: 4,
            type: TerrainDetailType.DeadTree,
            rotation: 0
        ));
    }

    private static bool[] CalculateTutorialTraversibility(BaseTerrain[] baseTerrain)
    {
        var traversibility = new bool[baseTerrain.Length];
        for (int i = 0; i < baseTerrain.Length; i++)
        {
            traversibility[i] = !baseTerrain[i].BlocksTanks();
        }
        return traversibility;
    }

    private static bool[] CalculateTutorialProjectileTraversibility(BaseTerrain[] baseTerrain)
    {
        var traversibility = new bool[baseTerrain.Length];
        for (int i = 0; i < baseTerrain.Length; i++)
        {
            traversibility[i] = !baseTerrain[i].BlocksProjectiles();
        }
        return traversibility;
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

    private static void SpawnLesson1Label(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_lesson_1",
            gameId: gameId,
            positionX: TUTORIAL_WIDTH / 2.0f,
            positionY: LESSON_LABEL_Y_POSITION,
            gridX: TUTORIAL_WIDTH / 2,
            gridY: LESSON_LABEL_Y_POSITION,
            type: TerrainDetailType.Label,
            label: "Lesson 1: Use the [color=#fceba8]`drive`[/color] command to move your tank around"
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

    private static void SpawnLesson2Label(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_lesson_2",
            gameId: gameId,
            positionX: TUTORIAL_WIDTH / 2.0f,
            positionY: LESSON_LABEL_Y_POSITION,
            gridX: TUTORIAL_WIDTH / 2,
            gridY: LESSON_LABEL_Y_POSITION,
            type: TerrainDetailType.Label,
            label: "Lesson 2: Use shorthands for almost everything. For example, use [color=#fceba8]`d`[/color] instead of [color=#fceba8]`drive`[/color], or [color=#fceba8]`ne`[/color] instead of [color=#fceba8]`northeast`[/color]"
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

    private static void SpawnLesson3Label(ReducerContext ctx, string gameId)
    {
        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_lesson_3",
            gameId: gameId,
            positionX: TUTORIAL_WIDTH / 2.0f,
            positionY: LESSON_LABEL_Y_POSITION,
            gridX: TUTORIAL_WIDTH / 2,
            gridY: LESSON_LABEL_Y_POSITION,
            type: TerrainDetailType.Label,
            label: "Lesson 3: Use the [color=#fceba8]`track`[/color] command ([color=#fceba8]`t`[/color]) to lock onto an enemy tank and then use [color=#fceba8]`fire`[/color] ([color=#fceba8]`f`[/color]) to fire at them"
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
            label: "Tutorial complete! Use the [color=#fceba8]`help`[/color] command to get additional information. Use [color=#fceba8]`tutorial complete`[/color] to start playing"
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
            RemoveTutorialLabel(ctx, $"{gameId}_lesson_1");
            SpawnTutorialWeaponPickup(ctx, gameId);
            SpawnLesson2Label(ctx, gameId);
            SpawnDriveToWeaponLabel(ctx, gameId);
            Log.Info($"Tutorial {gameId}: Advanced to DriveToWeapon");
        }
        else if (pickupType == PickupType.Sniper)
        {
            RemoveTutorialLabel(ctx, $"{gameId}_label_weapon");
            RemoveTutorialLabel(ctx, $"{gameId}_lesson_2");
            var targetCode = SpawnTutorialEnemy(ctx, gameId);
            SpawnLesson3Label(ctx, gameId);
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
            RemoveTutorialLabel(ctx, $"{gameId}_lesson_3");
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
