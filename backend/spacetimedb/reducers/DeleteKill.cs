using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void delete_kill(ReducerContext ctx, string killId)
    {
        var kill = ctx.Db.kills.Id.Find(killId);
        if (kill == null)
        {
            Log.Warn($"Kill with id {killId} not found");
            return;
        }

        ctx.Db.kills.Id.Delete(killId);
        Log.Info($"Kill {killId} deleted");
    }
}
