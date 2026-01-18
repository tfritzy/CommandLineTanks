using SpacetimeDB;
using System;
using static Types;

public static partial class Module
{
    private static string GetDayKey(ReducerContext ctx)
    {
        var timestampMicroseconds = ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var milliseconds = timestampMicroseconds / 1000L;
        var dateTimeOffset = DateTimeOffset.FromUnixTimeMilliseconds(milliseconds);
        return dateTimeOffset.UtcDateTime.ToString("yyyy-MM-dd");
    }

    public static void TrackDailyActiveUser(ReducerContext ctx, string playerId, GameType gameType)
    {
        if (gameType != GameType.Game)
        {
            return;
        }

        var player = ctx.Db.player.Id.Find(playerId);
        if (player == null)
        {
            Log.Error($"TrackDailyActiveUser: Player {playerId} not found");
            return;
        }

        var currentDay = GetDayKey(ctx);
        
        if (player.Value.LastGameJoinedDay == currentDay)
        {
            return;
        }

        var dailyStats = ctx.Db.daily_active_users.Day.Find(currentDay);
        if (dailyStats == null)
        {
            ctx.Db.daily_active_users.Insert(new DailyActiveUsers
            {
                Day = currentDay,
                TotalCount = 1,
                NewCount = player.Value.LastGameJoinedDay == null ? 1 : 0
            });
        }
        else
        {
            ctx.Db.daily_active_users.Day.Update(new DailyActiveUsers
            {
                Day = currentDay,
                TotalCount = dailyStats.Value.TotalCount + 1,
                NewCount = dailyStats.Value.NewCount + (player.Value.LastGameJoinedDay == null ? 1 : 0)
            });
        }

        ctx.Db.player.Id.Update(player.Value with { LastGameJoinedDay = currentDay });
    }
}
