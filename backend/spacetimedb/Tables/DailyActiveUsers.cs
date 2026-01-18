using SpacetimeDB;

public static partial class Module
{
    [Table(Name = "daily_active_users", Public = true)]
    public partial struct DailyActiveUsers
    {
        [PrimaryKey]
        public string Day;

        public int TotalCount;
        public int NewCount;
    }
}
