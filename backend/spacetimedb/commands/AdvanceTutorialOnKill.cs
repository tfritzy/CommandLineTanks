using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class AdvanceTutorialOnKill
    {
        public static void Call(ReducerContext ctx, string gameId, Tank killedTank)
        {
            var game = ctx.Db.game.Id.Find(gameId);
            if (game == null || game.Value.GameType != GameType.Tutorial)
            {
                return;
            }

            if (killedTank.Id == $"{gameId}_enemy")
            {
                RemoveTutorialLabel(ctx, $"{gameId}_label_fire");
                SpawnCardinalDirectionWaypoint(ctx, gameId);
                Log.Info($"Tutorial {gameId}: Advanced to CardinalDirections");
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

        private static void SpawnCardinalDirectionWaypoint(ReducerContext ctx, string gameId)
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
                label: "You can also drive using cardinal directions. Try [color=#fceba8]`d n`[/color] to drive north"
            ));
        }
    }
}
