using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "world", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(GameState), nameof(IsHomeWorld), nameof(Visibility) })]
    public partial struct World
    {
        [PrimaryKey]
        public string Id;

        public ulong CreatedAt;
        public int Width;
        public int Height;
        public BaseTerrain[] BaseTerrainLayer;
        [SpacetimeDB.Index.BTree]
        public GameState GameState;
        public bool IsHomeWorld;
        public ulong GameStartedAt;
        public long GameDurationMicros;
        public WorldVisibility Visibility;
        public int MaxPlayers;
        public int CurrentPlayerCount;
        public int BotCount;
    }
}
