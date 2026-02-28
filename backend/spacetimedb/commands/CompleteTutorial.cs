using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class CompleteTutorial
    {
        public static void Call(ReducerContext ctx, Identity identity)
        {
            var player = ctx.Db.Player.Identity.Find(identity);
            if (player != null)
            {
                ctx.Db.Player.Id.Update(player.Value with { TutorialComplete = true });
            }

            var tutorialGameId = GetTutorialGameId(identity);
            var game = ctx.Db.Game.Id.Find(tutorialGameId);
            if (game != null)
            {
                DeleteGame(ctx, tutorialGameId);
            }
        }
    }
}
