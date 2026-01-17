using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "game_redirect", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(NewGameId) })]
    public partial struct GameRedirect
    {
        [PrimaryKey]
        public string OldGameId;

        public string NewGameId;
        public ulong InsertedAt;
    }
}
