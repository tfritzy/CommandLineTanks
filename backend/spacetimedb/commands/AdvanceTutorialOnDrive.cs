using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class AdvanceTutorialOnDrive
    {
        public static void Call(ReducerContext ctx, string gameId, Tank tank)
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

            var labelId = $"{gameId}_label_waypoint";
            var label = ctx.Db.terrain_detail.Id.Find(labelId);
            
            if (label != null && label.Value.Label != null && label.Value.Label.Contains("cardinal"))
            {
                RemoveTutorialLabel(ctx, labelId);
                SpawnAnchorNavigationLabel(ctx, gameId);
                Log.Info($"Tutorial {gameId}: Advanced to AnchorNavigation");
            }
            else if (label != null && label.Value.Label != null && label.Value.Label.Contains("anchor"))
            {
                RemoveTutorialLabel(ctx, labelId);
                SpawnCompletionLabel(ctx, gameId);
                Log.Info($"Tutorial {gameId}: Complete!");
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

        private static void SpawnAnchorNavigationLabel(ReducerContext ctx, string gameId)
        {
            const int TUTORIAL_WIDTH = 20;
            const int TUTORIAL_HEIGHT = 12;

            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                id: $"{gameId}_label_waypoint",
                gameId: gameId,
                positionX: TUTORIAL_WIDTH / 2.0f,
                positionY: TUTORIAL_HEIGHT / 2.0f - 1,
                gridX: TUTORIAL_WIDTH / 2,
                gridY: TUTORIAL_HEIGHT / 2 - 1,
                type: TerrainDetailType.Label,
                label: "You can also navigate using anchors on the ground. Try driving to [color=#fceba8]`d uz`[/color]"
            ));
        }

        private static void SpawnCompletionLabel(ReducerContext ctx, string gameId)
        {
            const int TUTORIAL_WIDTH = 20;
            const int TUTORIAL_HEIGHT = 12;

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
    }
}
