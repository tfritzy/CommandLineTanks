using SpacetimeDB;
using static Types;
using static Module;

public static partial class GameTimer
{
    [Table(Scheduled = nameof(EndGame))]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct ScheduledGameEnd
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
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

        Module.StopWorldTickers(ctx, args.WorldId);

        ctx.Db.ScheduledWorldReset.Insert(new ScheduledWorldReset
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = Module.WORLD_RESET_DELAY_MICROS }),
            WorldId = args.WorldId
        });

        var score = ctx.Db.score.WorldId.Find(args.WorldId);
        int team0Kills = 0;
        int team1Kills = 0;
        if (score != null)
        {
            team0Kills = score.Value.Kills.Length > 0 ? score.Value.Kills[0] : 0;
            team1Kills = score.Value.Kills.Length > 1 ? score.Value.Kills[1] : 0;
        }
        Log.Info($"Game time limit reached! Team 0: {team0Kills} kills, Team 1: {team1Kills} kills. Game ending in 30 seconds...");
    }
}
