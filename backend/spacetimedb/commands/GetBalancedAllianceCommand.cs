using SpacetimeDB;

public static partial class Module
{
    public static class GetBalancedAllianceCommand
    {
        public static int Call(ReducerContext ctx, string gameId)
        {
            int alliance0Count = 0;
            int alliance1Count = 0;
            foreach (var t in ctx.Db.tank.GameId.Filter(gameId))
            {
                if (t.Alliance == 0)
                {
                    alliance0Count++;
                }
                else if (t.Alliance == 1)
                {
                    alliance1Count++;
                }
            }

            return alliance0Count <= alliance1Count ? 0 : 1;
        }
    }
}
