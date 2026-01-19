using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "game", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(GameState), nameof(GameType), nameof(Visibility) })]
    public partial struct Game
    {
        [PrimaryKey]
        public string Id;

        public ulong CreatedAt;
        public int Width;
        public int Height;
        [SpacetimeDB.Index.BTree]
        public GameState GameState;
        public GameType GameType;
        public ulong GameStartedAt;
        public long GameDurationMicros;
        public GameVisibility Visibility;
        public int MaxPlayers;
        public int CurrentPlayerCount;
        public int BotCount;
        public int MinPlayersPerTeam;
        public Identity? Owner;
    }
}
