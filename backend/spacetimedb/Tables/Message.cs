using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "message", Public = true)]
    public partial struct Message
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        public string Sender;

        public Identity? SenderIdentity;

        public string Text;

        public ulong Timestamp;
    }
}
