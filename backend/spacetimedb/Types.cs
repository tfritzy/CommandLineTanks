using SpacetimeDB;

public static partial class Types
{
    [Type]
    public partial struct Vector2(int x, int y)
    {
        public int X = x;
        public int Y = y;
    }

    [Type]
    public partial struct PathEntry
    {
        public Vector2 Position;
        public float DriveSpeedPercent;
    }

    [Type]
    public enum Direction
    {
        North,
        NorthEast,
        East,
        SouthEast,
        South,
        SouthWest,
        West,
        NorthWest
    }
}
