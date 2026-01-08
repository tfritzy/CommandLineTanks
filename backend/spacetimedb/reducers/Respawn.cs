using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void respawn(ReducerContext ctx, string worldId)
    {
        TankMetadata? metadataQuery = ctx.Db.tank_metadata.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (metadataQuery == null || metadataQuery.Value.TankId == null) return;
        var metadata = metadataQuery.Value;
        
        var tankQuery = ctx.Db.tank.Id.Find(metadata.TankId);
        if (tankQuery == null) return;
        var tank = tankQuery.Value;
        
        var positionQuery = ctx.Db.tank_position.TankId.Find(metadata.TankId);
        if (positionQuery == null) return;
        var position = positionQuery.Value;

        if (tank.Health > 0) return;

        DeleteTankPathIfExists(ctx, tank.Id);

        RespawnTank(ctx, tank, metadata, position, worldId, metadata.Alliance);
        Log.Info($"Tank {metadata.Name} respawned");
    }
}
