using SpacetimeDB;
using static Types;

public static partial class Module
{
    public partial struct Tank
    {
        public static Tank Build(
            ReducerContext ctx,
            string? id = null,
            string? worldId = null,
            Identity? owner = null,
            string? name = null,
            string? targetCode = null,
            string? joinCode = null,
            bool? isBot = null,
            AIBehavior aiBehavior = AIBehavior.None,
            AiConfig? aiConfig = null,
            int alliance = 0,
            int health = TANK_HEALTH,
            int maxHealth = TANK_HEALTH,
            int kills = 0,
            int deaths = 0,
            int killStreak = 0,
            int collisionRegionX = 0,
            int collisionRegionY = 0,
            string? target = null,
            float targetLead = 0.0f,
            string? message = null,
            float topSpeed = 3f,
            float turretRotationSpeed = 12f,
            float positionX = 0,
            float positionY = 0,
            Vector2Float? velocity = null,
            float turretAngularVelocity = 0,
            float turretRotation = 0.0f,
            float targetTurretRotation = 0.0f,
            Gun[]? guns = null,
            int selectedGunIndex = 0,
            long remainingSmokescreenCooldownMicros = 0,
            bool hasShield = false,
            long remainingOverdriveCooldownMicros = 0,
            long remainingOverdriveDurationMicros = 0,
            long remainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
            long remainingRepairCooldownMicros = 0,
            bool isRepairing = false,
            ulong repairStartedAt = 0,
            ulong deathTimestamp = 0,
            ulong? updatedAt = null)
        {
            var timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
            var computedIsBot = isBot ?? (aiBehavior != AIBehavior.None);
            
            return new Tank
            {
                Id = id ?? GenerateId(ctx, "tnk"),
                WorldId = worldId ?? "",
                Owner = owner ?? Identity.From(new byte[32]),
                Name = name ?? "",
                TargetCode = targetCode ?? "",
                JoinCode = joinCode,
                IsBot = computedIsBot,
                AIBehavior = aiBehavior,
                AiConfig = aiConfig,
                Alliance = alliance,
                Health = health,
                MaxHealth = maxHealth,
                Kills = kills,
                Deaths = deaths,
                KillStreak = killStreak,
                CollisionRegionX = collisionRegionX,
                CollisionRegionY = collisionRegionY,
                Target = target,
                TargetLead = targetLead,
                Message = message,
                PositionX = positionX,
                PositionY = positionY,
                TurretRotation = turretRotation,
                TargetTurretRotation = targetTurretRotation,
                TopSpeed = topSpeed,
                TurretRotationSpeed = turretRotationSpeed,
                Guns = guns ?? [BASE_GUN],
                SelectedGunIndex = selectedGunIndex,
                RemainingSmokescreenCooldownMicros = remainingSmokescreenCooldownMicros,
                HasShield = hasShield,
                Velocity = velocity ?? new Vector2Float(0, 0),
                TurretAngularVelocity = turretAngularVelocity,
                RemainingOverdriveCooldownMicros = remainingOverdriveCooldownMicros,
                RemainingOverdriveDurationMicros = remainingOverdriveDurationMicros,
                RemainingImmunityMicros = remainingImmunityMicros,
                RemainingRepairCooldownMicros = remainingRepairCooldownMicros,
                IsRepairing = isRepairing,
                RepairStartedAt = repairStartedAt,
                DeathTimestamp = deathTimestamp,
                UpdatedAt = updatedAt ?? timestamp
            };
        }
    }
}
