using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void ack_kill(ReducerContext ctx, string killId)
    {
        var kill = ctx.Db.kills.Id.Find(killId);
        if (kill == null)
        {
            Log.Warn($"Kill with id {killId} not found");
            return;
        }

        var updatedKill = kill.Value with
        {
            Acked = true
        };
        ctx.Db.kills.Id.Update(updatedKill);
        Log.Info($"Kill {killId} acknowledged");
    }
}
