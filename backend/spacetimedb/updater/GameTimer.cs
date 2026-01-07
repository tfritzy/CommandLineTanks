using SpacetimeDB;
using static Types;
using static Module;

public static partial class GameTimer
{
    [Table(Scheduled = nameof(EndGame))]
    public partial struct ScheduledGameEnd
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
    }

    [Reducer]
    public static void EndGame(ReducerContext ctx, ScheduledGameEnd args)
    {
        var world = ctx.Db.world.Id.Find(args.WorldId);
        if (world == null || world.Value.GameState != GameState.Playing)
        {
            return;
        }

        var updatedWorld = world.Value with { GameState = GameState.Results };
        ctx.Db.world.Id.Update(updatedWorld);

        StopWorldTickers(ctx, args.WorldId);

        ctx.Db.ScheduledWorldReset.Insert(new ScheduledWorldReset
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = Module.WORLD_RESET_DELAY_MICROS }),
            WorldId = args.WorldId
        });
    }
}
