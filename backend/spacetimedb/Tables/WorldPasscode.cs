using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "world_passcode", Public = false)]
    public partial struct WorldPasscode
    {
        [PrimaryKey]
        public string WorldId;

        public string Passcode;
    }
}
