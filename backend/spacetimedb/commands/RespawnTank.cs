using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static class RespawnTank
    {
        public static void Call(ReducerContext ctx, Tank tank, TankTransform transform, string gameId, int alliance, bool resetKills = false, (float, float)? spawnPosition = null)
        {
            var traversibilityMap = ctx.Db.traversibility_map.GameId.Find(gameId);
            if (traversibilityMap == null)
            {
                return;
            }

            var (spawnX, spawnY) = spawnPosition ?? FindSpawnPosition.Call(ctx, traversibilityMap.Value, alliance, ctx.Rng);

            var newTargetCode = AllocateTargetCode.Call(ctx, gameId) ?? tank.TargetCode;

            var respawnedTank = tank with
            {
                Health = tank.MaxHealth,
                Kills = resetKills ? 0 : tank.Kills,
                Deaths = resetKills ? 0 : tank.Deaths,
                KillStreak = 0,
                Target = null,
                TargetLead = 0.0f,
                Message = null,
                SelectedGunIndex = 0,
                HasShield = false,
                RemainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
                DeathTimestamp = 0,
                Alliance = alliance,
                TargetCode = newTargetCode
            };

            ClearNonBaseGuns.Call(ctx, tank.Id);

            var respawnedTransform = transform with
            {
                PositionX = spawnX,
                PositionY = spawnY,
                Velocity = new Vector2Float(0, 0),
                TurretRotation = 0,
                TargetTurretRotation = 0,
                TurretAngularVelocity = 0,
                UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            };

            ctx.Db.tank.Id.Update(respawnedTank);
            ctx.Db.tank_transform.TankId.Update(respawnedTransform);
        }
    }
}
