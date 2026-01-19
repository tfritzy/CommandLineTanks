using SpacetimeDB;

public static partial class Module
{
    public static class GetBalancedAlliance
    {
        public static int Call(ReducerContext ctx, string gameId)
        {
            int alliance0HumanCount = 0;
            int alliance1HumanCount = 0;
            int alliance0TotalCount = 0;
            int alliance1TotalCount = 0;

            foreach (var t in ctx.Db.tank.GameId.Filter(gameId))
            {
                if (t.Alliance == 0)
                {
                    alliance0TotalCount++;
                    if (!t.IsBot)
                    {
                        alliance0HumanCount++;
                    }
                }
                else if (t.Alliance == 1)
                {
                    alliance1TotalCount++;
                    if (!t.IsBot)
                    {
                        alliance1HumanCount++;
                    }
                }
            }

            if (alliance0HumanCount != alliance1HumanCount)
            {
                return alliance0HumanCount < alliance1HumanCount ? 0 : 1;
            }

            return alliance0TotalCount <= alliance1TotalCount ? 0 : 1;
        }
    }
}
