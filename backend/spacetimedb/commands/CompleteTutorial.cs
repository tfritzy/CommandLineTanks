using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class CompleteTutorial
    {
        public static void Call(ReducerContext ctx, Identity identity)
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
}
