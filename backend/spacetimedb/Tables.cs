using SpacetimeDB;

public static partial class Module
{
    [Table]
    public partial struct Player
    {
        [PrimaryKey]
        public string Id;

        [Unique]
        public Identity Identity;

        public string Name;
        public ulong CreatedAt;
    }

    [Table]
    public partial struct World
    {
        [PrimaryKey]
        public string Id;

        public string Name;
        public ulong CreatedAt;
    }

    [Table]
    public partial struct Tank
    {
        [PrimaryKey]
        public string Id;

        public string WorldId;

        [Unique]
        public Identity Player;

        public float PositionX;
        public float PositionY;

        public float BodyRotation;
        public float TurretRotation;
    }
}
