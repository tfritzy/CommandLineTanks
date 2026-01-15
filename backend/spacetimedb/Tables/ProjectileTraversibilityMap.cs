using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "projectile_traversibility_map", Public = true)]
    public partial struct ProjectileTraversibilityMap
    {
        [PrimaryKey]
        public string GameId;

        public byte[] Map;
        public int Width;
        public int Height;
        public ulong Version;

        public bool IsTraversable(int index)
        {
            return BitPackingUtils.GetBit(Map, index);
        }

        public void SetTraversable(int index, bool value)
        {
            BitPackingUtils.SetBit(Map, index, value);
            Version++;
        }
    }
}
