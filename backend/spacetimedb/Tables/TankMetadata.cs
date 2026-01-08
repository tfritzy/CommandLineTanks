using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    [Table(Name = "tank_metadata", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(Owner) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(TargetCode) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(IsBot) })]
    public partial struct TankMetadata
    {
        [PrimaryKey]
        public string TankId;

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

        public int MaxHealth;

        public float TopSpeed;

        public float TurretRotationSpeed;
    }
}
