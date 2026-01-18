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

    private static readonly (int x, int y) TUTORIAL_PLAYER_SPAWN = (3, 6);
    private static readonly (int x, int y) TUTORIAL_HEALTH_PICKUP = (6, 6);
    private static readonly (int x, int y) TUTORIAL_WEAPON_PICKUP = (9, 9);
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

        AddTankToGame.Call(ctx, tank, transform);
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
        SpawnDriveToHealthLabel(ctx, tutorialGameId);

        EnsureTankInTutorial(ctx, tutorialGameId, identity, joinCode);

        StartHomeGameTickers(ctx, tutorialGameId);

        Log.Info($"Created tutorial game {tutorialGameId} for identity {identity}");
    }

    private static void AddTutorialDecorations(BaseTerrain[] baseTerrain, int width, int height)
    {
        baseTerrain[1 * width + 0] = BaseTerrain.Water;
        baseTerrain[1 * width + 1] = BaseTerrain.Water;
        baseTerrain[2 * width + 0] = BaseTerrain.Water;
        baseTerrain[2 * width + 1] = BaseTerrain.Water;
        baseTerrain[2 * width + 2] = BaseTerrain.Water;
        baseTerrain[3 * width + 1] = BaseTerrain.Water;

        baseTerrain[0 * width + 15] = BaseTerrain.Water;
        baseTerrain[0 * width + 16] = BaseTerrain.Water;
        baseTerrain[1 * width + 15] = BaseTerrain.Water;
        baseTerrain[1 * width + 16] = BaseTerrain.Water;
        baseTerrain[1 * width + 17] = BaseTerrain.Water;
        baseTerrain[2 * width + 16] = BaseTerrain.Water;

        baseTerrain[8 * width + 0] = BaseTerrain.Water;
        baseTerrain[9 * width + 0] = BaseTerrain.Water;
        baseTerrain[9 * width + 1] = BaseTerrain.Water;
        baseTerrain[10 * width + 0] = BaseTerrain.Water;
        baseTerrain[10 * width + 1] = BaseTerrain.Water;
        baseTerrain[11 * width + 1] = BaseTerrain.Water;

        baseTerrain[9 * width + 18] = BaseTerrain.Water;
        baseTerrain[9 * width + 19] = BaseTerrain.Water;
        baseTerrain[10 * width + 17] = BaseTerrain.Water;
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
            positionX: 1.5f,
            positionY: 5.5f,
            gridX: 1,
            gridY: 5,
            type: TerrainDetailType.Rock,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 13.5f,
            positionY: 1.5f,
            gridX: 13,
            gridY: 1,
            type: TerrainDetailType.Rock,
            rotation: 1
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 16.5f,
            positionY: 9.5f,
            gridX: 16,
            gridY: 9,
            type: TerrainDetailType.Rock,
            rotation: 2
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 4.5f,
            positionY: 10.5f,
            gridX: 4,
            gridY: 10,
            type: TerrainDetailType.Tree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 17.5f,
            positionY: 11.5f,
            gridX: 17,
            gridY: 11,
            type: TerrainDetailType.Tree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 11.5f,
            positionY: 0.5f,
            gridX: 11,
            gridY: 0,
            type: TerrainDetailType.Tree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 2.5f,
            positionY: 7.5f,
            gridX: 2,
            gridY: 7,
            type: TerrainDetailType.Tree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 18.5f,
            positionY: 3.5f,
            gridX: 18,
            gridY: 3,
            type: TerrainDetailType.Tree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 5.5f,
            positionY: 0.5f,
            gridX: 5,
            gridY: 0,
            type: TerrainDetailType.Tree,
            rotation: 0
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: 14.5f,
            positionY: 11.5f,
            gridX: 14,
            gridY: 11,
            type: TerrainDetailType.Tree,
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
            label: "You're low on health! Use [color=#fceba8]`d e 3`[/color] to pick up this health pack"
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

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            id: $"{gameId}_label_help",
            gameId: gameId,
            positionX: TUTORIAL_WIDTH / 2.0f,
            positionY: TUTORIAL_HEIGHT / 2.0f,
            gridX: TUTORIAL_WIDTH / 2,
            gridY: TUTORIAL_HEIGHT / 2,
            type: TerrainDetailType.Label,
            label: "[color=#a9bcbf]Use the help command to learn more[/color]"
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
