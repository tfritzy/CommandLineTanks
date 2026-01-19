using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "base_terrain_layer", Public = true)]
    public partial struct BaseTerrainLayer
    {
        [PrimaryKey]
        public string GameId;

        public BaseTerrain[] Layer;
        public int Width;
        public int Height;
    }
}
