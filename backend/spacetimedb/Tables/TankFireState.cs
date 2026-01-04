using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "tank_fire_state", Public = true)]
    public partial struct TankFireState
    {
        [PrimaryKey]
        public string TankId;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public ulong LastFireTime;
    }
}
