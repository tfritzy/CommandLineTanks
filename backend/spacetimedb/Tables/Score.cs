using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "score", Public = true)]
    public partial struct Score
    {
        [PrimaryKey]
        public string GameId;

        public int[] Kills;
    }
}
