using SpacetimeDB;
using static SpacetimeDB.Index;
using static Types;

public static partial class Module
{
    [Table(Name = "tank_path", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(GameId), nameof(Owner) })]
    public partial struct TankPath
    {
        [PrimaryKey]
        public string TankId;
        [BTree]
        public string GameId;
        public Identity Owner;
        public Vector2Float[] Path;
        public int PathIndex;
    }
}
