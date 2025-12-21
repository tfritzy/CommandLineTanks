using SpacetimeDB;
using static Types;

public static partial class HomeworldPickupManager
{
    [Table(Scheduled = nameof(EnsureHomeworldPickups))]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct ScheduledHomeworldPickupCheck
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
    }

    public struct ExpectedPickupLocation
    {
        public float PositionX;
        public float PositionY;
        public TerrainDetailType Type;
    }

    [Reducer]
    public static void EnsureHomeworldPickups(ReducerContext ctx, ScheduledHomeworldPickupCheck args)
    {
        var expectedPickups = GetExpectedHomeworldPickupLocations();

        foreach (var expected in expectedPickups)
        {
            var existingPickup = ctx.Db.pickup.WorldId_PositionX_PositionY.Filter((args.WorldId, expected.PositionX, expected.PositionY));
            if (!existingPickup.Any())
            {
                var pickupId = Module.GenerateId(ctx, "pickup");
                ctx.Db.pickup.Insert(new Pickup
                {
                    Id = pickupId,
                    WorldId = args.WorldId,
                    PositionX = expected.PositionX,
                    PositionY = expected.PositionY,
                    Type = expected.Type
                });

                Log.Info($"Spawned {expected.Type} at ({expected.PositionX}, {expected.PositionY}) in homeworld {args.WorldId}");
            }
        }
    }

    public static void InitializeHomeworldPickupTimer(ReducerContext ctx, string worldId)
    {
        ctx.Db.ScheduledHomeworldPickupCheck.Insert(new ScheduledHomeworldPickupCheck
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = Module.HOMEWORLD_PICKUP_RESPAWN_DELAY_MICROS }),
            WorldId = worldId
        });

        Log.Info($"Initialized homeworld pickup timer for {worldId}");
    }

    private static ExpectedPickupLocation[] GetExpectedHomeworldPickupLocations()
    {
        int worldSize = Module.HOMEWORLD_SIZE;
        int rectCenterX = worldSize / 2;
        int rectCenterY = worldSize / 2;
        int rectWidth = 24;
        int rectHeight = 24;

        int startX = rectCenterX - rectWidth / 2;
        int startY = rectCenterY - rectHeight / 2;

        int pickupCount = Module.PICKUP_TYPES.Length;
        int perimeter = 2 * (rectWidth - 1) + 2 * (rectHeight - 1);
        float spacing = (float)perimeter / pickupCount;

        var locations = new ExpectedPickupLocation[pickupCount];
        int pickupIndex = 0;
        float distance = 0;

        while (pickupIndex < pickupCount)
        {
            int x = 0;
            int y = 0;

            int d = (int)distance;

            if (d < rectWidth)
            {
                x = startX + d;
                y = startY;
            }
            else if (d < rectWidth + rectHeight - 1)
            {
                x = startX + rectWidth - 1;
                y = startY + (d - rectWidth + 1);
            }
            else if (d < 2 * rectWidth + rectHeight - 2)
            {
                x = startX + rectWidth - 1 - (d - rectWidth - rectHeight + 1);
                y = startY + rectHeight - 1;
            }
            else
            {
                x = startX;
                y = startY + rectHeight - 1 - (d - 2 * rectWidth - rectHeight + 2);
            }

            locations[pickupIndex] = new ExpectedPickupLocation
            {
                PositionX = x + 0.5f,
                PositionY = y + 0.5f,
                Type = Module.PICKUP_TYPES[pickupIndex]
            };

            pickupIndex++;
            distance += spacing;
        }

        return locations;
    }
}
