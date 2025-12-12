using SpacetimeDB;

public static partial class Module
{
    private static readonly string[] NatoPhoneticAlphabet = [
        "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot",
        "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima",
        "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo",
        "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "Xray",
        "Yankee", "Zulu"
    ];

    public static string? AllocateTankName(ReducerContext ctx, string worldId)
    {
        var tanksInWorld = ctx.Db.tank.WorldId.Filter(worldId);
        var usedNames = new System.Collections.Generic.HashSet<string>();
        
        foreach (var tank in tanksInWorld)
        {
            if (tank.Name != null)
            {
                usedNames.Add(tank.Name);
            }
        }

        foreach (var name in NatoPhoneticAlphabet)
        {
            if (!usedNames.Contains(name))
            {
                return name;
            }
        }

        return null;
    }
}
