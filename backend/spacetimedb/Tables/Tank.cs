using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    [Table(Name = "tank", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(TargetCode) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(CollisionRegionX), nameof(CollisionRegionY) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(Owner) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(IsBot) })]
    public partial struct Tank
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        [SpacetimeDB.Index.BTree]
        public Identity Owner;

        public string Name;

        public string TargetCode;

        public string? JoinCode;

        public bool IsBot;

        public AIBehavior AIBehavior;

        public AiConfig? AiConfig;

        public int Alliance;

        public int Health;

        public int MaxHealth;

        public int Kills;

        public int Deaths;

        public int KillStreak;

        public int CollisionRegionX;

        public int CollisionRegionY;

        public string? Target;
        public float TargetLead;

        public string? Message;

        public float TopSpeed;
        public float TurretRotationSpeed;

        public float PositionX;
        public float PositionY;

        public Vector2Float Velocity;
        public float TurretAngularVelocity;

        public float TurretRotation;
        public float TargetTurretRotation;

        public Gun[] Guns;
        public int SelectedGunIndex;

        public long RemainingImmunityMicros;

        public ulong DeathTimestamp;

        public ulong UpdatedAt;

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
            long remainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
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
                Velocity = velocity ?? new Vector2Float(0, 0),
                TurretAngularVelocity = turretAngularVelocity,
                RemainingImmunityMicros = remainingImmunityMicros,
                DeathTimestamp = deathTimestamp,
                UpdatedAt = updatedAt ?? timestamp
            };
        }
    }
}
