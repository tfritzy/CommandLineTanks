using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "tutorial_progress", Public = true)]
    public partial struct TutorialProgress
    {
        [PrimaryKey]
        public string GameId;

        public TutorialState State;

        public string? TargetTankId;
    }
}
