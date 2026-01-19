using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class AdvanceTutorialOnTarget
    {
        public static void Call(ReducerContext ctx, string gameId, Tank playerTank)
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

        private static void RemoveTutorialLabel(ReducerContext ctx, string labelId)
        {
            var label = ctx.Db.terrain_detail.Id.Find(labelId);
            if (label != null)
            {
                ctx.Db.terrain_detail.Id.Delete(labelId);
            }
        }

        private static void SpawnFireLabel(ReducerContext ctx, string gameId)
        {
            const int TUTORIAL_ENEMY_SPAWN_X = 16;
            const int TUTORIAL_ENEMY_SPAWN_Y = 6;

            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                id: $"{gameId}_label_fire",
                gameId: gameId,
                positionX: TUTORIAL_ENEMY_SPAWN_X + 0.5f,
                positionY: TUTORIAL_ENEMY_SPAWN_Y - 0.3f,
                gridX: TUTORIAL_ENEMY_SPAWN_X,
                gridY: TUTORIAL_ENEMY_SPAWN_Y - 1,
                type: TerrainDetailType.Label,
                label: "Now fire! Use [color=#fceba8]`f`[/color] repeatedly to destroy them"
            ));
        }
    }
}
