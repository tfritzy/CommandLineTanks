using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class EnsureTutorialGame
    {
        public static void Call(ReducerContext ctx, Identity identity, string joinCode)
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
    }
}
