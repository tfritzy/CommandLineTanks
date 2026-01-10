using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    [Table(Name = "tank", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(Tank.GameId), nameof(Tank.Owner) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(Tank.GameId), nameof(Tank.TargetCode) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(Tank.GameId), nameof(Tank.IsBot) })]
    public partial struct Tank
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        [SpacetimeDB.Index.BTree]
        public Identity Owner;

        public string Name;

        public string TargetCode;

        public string? JoinCode;

        public bool IsBot;

        public AIBehavior AIBehavior;

        public AiConfig? AiConfig;

        public int Alliance;

        public int MaxHealth;

        public float TopSpeed;

        public float TurretRotationSpeed;

        public int Health;

        public int Kills;

        public int Deaths;

        public int KillStreak;

        public string? Target;
        public float TargetLead;

        public string? Message;

        public Gun[] Guns;
        public int SelectedGunIndex;

        public bool HasShield;

        public long RemainingImmunityMicros;

        public ulong DeathTimestamp;

        public Identity? LastDamagedBy;
    }

    public static (Tank, TankTransform) BuildTank(
        ReducerContext ctx,
        string? id = null,
        string? gameId = null,
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
        long remainingImmunityMicros = 0,
        ulong deathTimestamp = 0,
        Identity? lastDamagedBy = null,
        ulong? updatedAt = null)
    {
        var timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var computedIsBot = isBot ?? (aiBehavior != AIBehavior.None);
        var tankId = id ?? GenerateId(ctx, "tnk");
        var tankGameId = gameId ?? "";
        var computedUpdatedAt = updatedAt ?? timestamp;
        
        var tank = new Tank
        {
            Id = tankId,
            GameId = tankGameId,
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
            TurretRotationSpeed = turretRotationSpeed,
            Health = health,
            Kills = kills,
            Deaths = deaths,
            KillStreak = killStreak,
            Target = target,
            TargetLead = targetLead,
            Message = message,
            Guns = guns ?? [BASE_GUN],
            SelectedGunIndex = selectedGunIndex,
            HasShield = hasShield,
            RemainingImmunityMicros = remainingImmunityMicros,
            DeathTimestamp = deathTimestamp,
            LastDamagedBy = lastDamagedBy
        };

        var transform = new TankTransform
        {
            TankId = tankId,
            GameId = tankGameId,
            PositionX = positionX,
            PositionY = positionY,
            Velocity = velocity ?? new Vector2Float(0, 0),
            CollisionRegionX = collisionRegionX,
            CollisionRegionY = collisionRegionY,
            TurretRotation = turretRotation,
            TargetTurretRotation = targetTurretRotation,
            TurretAngularVelocity = turretAngularVelocity,
            UpdatedAt = computedUpdatedAt
        };

        return (tank, transform);
    }
}
