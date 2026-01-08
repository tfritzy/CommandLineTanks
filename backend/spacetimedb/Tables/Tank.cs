using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    [Table(Name = "tank", Public = true)]
    public partial struct Tank
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public int Health;

        public int Kills;

        public int Deaths;

        public int KillStreak;

        public string? Target;
        public float TargetLead;

        public string? Message;

        public float TurretAngularVelocity;

        public float TurretRotation;
        public float TargetTurretRotation;

        public Gun[] Guns;
        public int SelectedGunIndex;

        public bool HasShield;

        public long RemainingImmunityMicros;

        public ulong DeathTimestamp;

        public Identity? LastDamagedBy;
    }

    public static (Tank, TankMetadata, TankPosition) BuildTank(
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
        bool hasShield = false,
        long remainingImmunityMicros = SPAWN_IMMUNITY_DURATION_MICROS,
        ulong deathTimestamp = 0,
        Identity? lastDamagedBy = null,
        ulong? updatedAt = null)
    {
        var timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var computedIsBot = isBot ?? (aiBehavior != AIBehavior.None);
        var tankId = id ?? GenerateId(ctx, "tnk");
        var tankWorldId = worldId ?? "";
        var computedUpdatedAt = updatedAt ?? timestamp;
        
        var tank = new Tank
        {
            Id = tankId,
            WorldId = tankWorldId,
            Health = health,
            Kills = kills,
            Deaths = deaths,
            KillStreak = killStreak,
            Target = target,
            TargetLead = targetLead,
            Message = message,
            TurretRotation = turretRotation,
            TargetTurretRotation = targetTurretRotation,
            Guns = guns ?? [BASE_GUN],
            SelectedGunIndex = selectedGunIndex,
            HasShield = hasShield,
            TurretAngularVelocity = turretAngularVelocity,
            RemainingImmunityMicros = remainingImmunityMicros,
            DeathTimestamp = deathTimestamp,
            LastDamagedBy = lastDamagedBy
        };

        var metadata = new TankMetadata
        {
            TankId = tankId,
            WorldId = tankWorldId,
            Owner = owner ?? Identity.From(new byte[32]),
            Name = name ?? "",
            TargetCode = targetCode ?? "",
            JoinCode = joinCode,
            IsBot = computedIsBot,
            AIBehavior = aiBehavior,
            AiConfig = aiConfig,
            Alliance = alliance,
            MaxHealth = maxHealth,
            TopSpeed = topSpeed,
            TurretRotationSpeed = turretRotationSpeed
        };

        var position = new TankPosition
        {
            TankId = tankId,
            WorldId = tankWorldId,
            PositionX = positionX,
            PositionY = positionY,
            Velocity = velocity ?? new Vector2Float(0, 0),
            CollisionRegionX = collisionRegionX,
            CollisionRegionY = collisionRegionY,
            UpdatedAt = computedUpdatedAt
        };

        return (tank, metadata, position);
    }
}
