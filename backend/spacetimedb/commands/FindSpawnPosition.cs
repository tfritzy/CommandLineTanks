using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    public static class FindSpawnPosition
    {
        private const int MAX_SPAWN_ATTEMPTS = 100;
        private const int SPAWN_ZONE_WIDTH = 5;

        public static (float, float) Call(ReducerContext ctx, Game game, int alliance, Random random)
        {
            var traversibilityMapQuery = ctx.Db.traversibility_map.GameId.Find(game.Id);
            if (traversibilityMapQuery == null) return (0, 0);
            return Call(ctx, traversibilityMapQuery.Value, alliance, random);
        }

        public static (float, float) Call(ReducerContext ctx, TraversibilityMap traversibilityMap, int alliance, Random random)
        {
            int gameWidth = traversibilityMap.Width;
            int gameHeight = traversibilityMap.Height;

            int minX, maxX, minY, maxY;

            if (alliance == 0)
            {
                minX = 0;
                maxX = SPAWN_ZONE_WIDTH;
            }
            else if (alliance == 1)
            {
                minX = gameWidth - SPAWN_ZONE_WIDTH;
                maxX = gameWidth;
            }
            else
            {
                minX = 0;
                maxX = SPAWN_ZONE_WIDTH;
            }

            minY = 0;
            maxY = gameHeight;

            for (int attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++)
            {
                int x = minX;
                int y = minY;

                if (maxX > minX)
                {
                    x = minX + random.Next(maxX - minX);
                }

                if (maxY > minY)
                {
                    y = minY + random.Next(maxY - minY);
                }

                int index = y * gameWidth + x;
                if (index < traversibilityMap.Map.Length * 8 && traversibilityMap.IsTraversable(index))
                {
                    return (x + 0.5f, y + 0.5f);
                }
            }

            float centerX = (minX + maxX) / 2.0f + 0.5f;
            float centerY = (minY + maxY) / 2.0f + 0.5f;
            return (centerX, centerY);
        }
    }
}
