using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "traversibility_map", Public = true)]
    public partial struct TraversibilityMap
    {
        [PrimaryKey]
        public string WorldId;

        public bool[] Map;
        public int Width;
        public int Height;
    }
}
