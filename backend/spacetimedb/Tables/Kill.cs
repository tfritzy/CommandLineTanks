using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "kills", Public = true)]
    public partial struct Kill
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        public Identity Killer;

        public string KilleeName;

        public ulong Timestamp;
    }
}
