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
        public string GameId;
    }

    [Reducer]
    public static void EndGame(ReducerContext ctx, ScheduledGameEnd args)
    {
        var game = ctx.Db.game.Id.Find(args.GameId);
        if (game == null || game.Value.GameState != GameState.Playing)
        {
            return;
        }

        var updatedGame = game.Value with { GameState = GameState.Results };
        ctx.Db.game.Id.Update(updatedGame);

        ctx.Db.message.Insert(new Message
        {
            Id = GenerateId(ctx, "msg"),
            GameId = args.GameId,
            Sender = "System",
            SenderIdentity = null,
            Text = "Game ended!",
            Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });

        StopGameTickers(ctx, args.GameId);

        ctx.Db.ScheduledGameReset.Insert(new ScheduledGameReset
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = Module.GAME_RESET_DELAY_MICROS }),
            GameId = args.GameId
        });
    }
}
