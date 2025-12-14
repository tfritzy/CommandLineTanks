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
        public bool Reverse;
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
        Ground,
        Stream,
        Road
    }

    [Type]
    public enum TerrainDetailType : byte
    {
        None,
        Cliff,
        Rock,
        Tree,
        Bridge,
        Fence,
        HayBale,
        Field
    }

    [Type]
    public enum GameState : byte
    {
        Playing,
        Results
    }
}
