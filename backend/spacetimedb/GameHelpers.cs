using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void AddTankToGame(ReducerContext ctx, Tank tank, TankTransform transform)
    {
        ctx.Db.tank.Insert(tank);
        ctx.Db.tank_transform.Insert(transform);
        
        if (tank.IsBot)
        {
            IncrementBotCount(ctx, tank.GameId);
        }
        else
        {
            IncrementPlayerCount(ctx, tank.GameId);
        }
    }

    public static void RemoveTankFromGame(ReducerContext ctx, Tank tank)
    {
        var isBot = tank.IsBot;
        var gameId = tank.GameId;
        
        var fireState = ctx.Db.tank_fire_state.TankId.Find(tank.Id);
        if (fireState != null)
        {
            ctx.Db.tank_fire_state.TankId.Delete(tank.Id);
        }
        
        DeleteTankPathIfExists(ctx, tank.Id);
        DeleteTankGuns(ctx, tank.Id);
        
        ctx.Db.tank_transform.TankId.Delete(tank.Id);
        ctx.Db.tank.Id.Delete(tank.Id);
        
        if (isBot)
        {
            DecrementBotCount(ctx, gameId);
        }
        else
        {
            DecrementPlayerCount(ctx, gameId);
        }
    }

    public static void IncrementPlayerCount(ReducerContext ctx, string gameId)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null) return;

        var updatedGame = game.Value with
        {
            CurrentPlayerCount = game.Value.CurrentPlayerCount + 1
        };
        ctx.Db.game.Id.Update(updatedGame);
    }

    public static void DecrementPlayerCount(ReducerContext ctx, string gameId)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null) return;

        var updatedGame = game.Value with
        {
            CurrentPlayerCount = Math.Max(0, game.Value.CurrentPlayerCount - 1)
        };
        ctx.Db.game.Id.Update(updatedGame);
    }

    public static void IncrementBotCount(ReducerContext ctx, string gameId)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null) return;

        var updatedGame = game.Value with
        {
            BotCount = game.Value.BotCount + 1
        };
        ctx.Db.game.Id.Update(updatedGame);
    }

    public static void DecrementBotCount(ReducerContext ctx, string gameId)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null) return;

        var updatedGame = game.Value with
        {
            BotCount = Math.Max(0, game.Value.BotCount - 1)
        };
        ctx.Db.game.Id.Update(updatedGame);
    }

    public static void DeleteHomegameIfEmpty(ReducerContext ctx, string identityString)
    {
        var homegame = ctx.Db.game.Id.Find(identityString);
        if (homegame == null || !homegame.Value.IsHomeGame)
        {
            return;
        }

        var hasHumanPlayers = ctx.Db.tank.GameId.Filter(identityString).Any(t => !t.IsBot);
        if (hasHumanPlayers)
        {
            return;
        }

        DeleteGame(ctx, identityString);
        Log.Info($"Deleted empty homegame for identity {identityString}");
    }

    public static void EnsureTankInHomegame(ReducerContext ctx, string identityString, string joinCode)
    {
        var existingTank = ctx.Db.tank.GameId_Owner.Filter((identityString, ctx.Sender))
            .FirstOrDefault();
        
        if (existingTank.Id != null)
        {
            var updatedTank = existingTank with { JoinCode = joinCode };
            ctx.Db.tank.Id.Update(updatedTank);
            StartGameTickers(ctx, identityString);
            Log.Info($"Updated existing homegame tank with new join code");
            return;
        }

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";

        var (tank, transform) = BuildTank(
            ctx: ctx,
            gameId: identityString,
            owner: ctx.Sender,
            name: playerName,
            targetCode: "",
            joinCode: joinCode,
            alliance: 0,
            positionX: HOMEGAME_WIDTH / 2 + .5f,
            positionY: HOMEGAME_HEIGHT / 2 + .5f,
            aiBehavior: AIBehavior.None);

        AddTankToGame(ctx, tank, transform);
        StartGameTickers(ctx, identityString);
        Log.Info($"Created homegame tank for identity {identityString}");
    }

    public static void ReturnToHomegame(ReducerContext ctx, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var homegame = ctx.Db.game.Id.Find(identityString);
        if (homegame == null)
        {
            CreateHomegame(ctx, identityString);
        }

        EnsureTankInHomegame(ctx, identityString, joinCode);
    }

    public static Tank TargetTankByCode(ReducerContext ctx, Tank tank, string targetCode)
    {
        if (tank.Health <= 0) return tank;

        var targetCodeLower = targetCode.ToLower();
        var targetTank = ctx.Db.tank.GameId_TargetCode.Filter((tank.GameId, targetCodeLower)).FirstOrDefault();

        if (targetTank.Id == null)
        {
            return tank;
        }

        return tank with
        {
            Target = targetTank.Id,
            TargetLead = 0
        };
    }
}
