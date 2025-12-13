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
    public partial struct Vector2Float(float x, float y)
    {
        public float X = x;
        public float Y = y;
    }

    [Type]
    public partial struct PathEntry
    {
        public Vector2 Position;
        public float ThrottlePercent;
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

    [Type]
    public enum BaseTerrain : byte
    {
        Ground = 0,
        Stream = 1,
        Road = 2
    }

    [Type]
    public enum TerrainDetail : byte
    {
        None = 0,
        Cliff = 1,
        Rock = 2,
        Tree = 3,
        Bridge = 4,
        Fence = 5,
        HayBale = 6,
        Field = 7
    }
}
