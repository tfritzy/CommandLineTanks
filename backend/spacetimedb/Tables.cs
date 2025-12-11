using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "player", Public = true)]
    public partial struct Player
    {
        [PrimaryKey]
        public string Id;

        [Unique]
        public Identity Identity;

        public string Name;
        public ulong CreatedAt;
    }

    [Table(Name = "world", Public = true)]
    public partial struct World
    {
        [PrimaryKey]
        public string Id;

        public string Name;
        public ulong CreatedAt;
    }

    [Table(Name = "tank", Public = true)]
    public partial struct Tank
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        [SpacetimeDB.Index.BTree]
        public Identity Owner;

        public PathEntry[] Path;
        public float TopSpeed;
        public float BodyRotationSpeed;
        public float TurretRotationSpeed;

        public float PositionX;
        public float PositionY;

        public float BodyRotation;
        public float TurretRotation;
    }
}
