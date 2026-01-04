using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "tank_path", Public = true)]
    public partial struct TankPath
    {
        [PrimaryKey]
        public string TankId;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public PathEntry[] Path;
    }
}
