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

    public static void InitializeAvailableNamesForWorld(ReducerContext ctx, string worldId)
    {
        foreach (var name in NatoPhoneticAlphabet)
        {
            ctx.Db.available_tank_name.Insert(new AvailableTankName
            {
                WorldId = worldId,
                Name = name
            });
        }
    }

    public static string? AllocateTankName(ReducerContext ctx, string worldId)
    {
        var availableNames = ctx.Db.available_tank_name.WorldId.Filter(worldId);
        var availableName = availableNames.FirstOrDefault();
        
        if (availableName.Name == null)
        {
            return null;
        }

        ctx.Db.available_tank_name.Id.Delete(availableName.Id);
        return availableName.Name;
    }

    public static void ReleaseTankName(ReducerContext ctx, string worldId, string name)
    {
        ctx.Db.available_tank_name.Insert(new AvailableTankName
        {
            WorldId = worldId,
            Name = name
        });
    }
}
