using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void changeName(ReducerContext ctx, string newName)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        if (string.IsNullOrWhiteSpace(newName))
        {
            Log.Error("Invalid name: name cannot be empty or whitespace");
            return;
        }

        if (newName.Length > 15)
        {
            Log.Error("Invalid name: name cannot exceed 15 characters");
            return;
        }

        if (NameValidator.ContainsInappropriateContent(newName))
        {
            Log.Error("Invalid name: name contains inappropriate content");
            return;
        }

        var updatedPlayer = player.Value;
        updatedPlayer.Name = newName;
        ctx.Db.player.Id.Update(updatedPlayer);

        var metadatas = ctx.Db.tank_metadata.Owner.Filter(ctx.Sender);
        foreach (var metadata in metadatas)
        {
            var updatedMetadata = metadata with { Name = newName };
            ctx.Db.tank_metadata.TankId.Update(updatedMetadata);
        }

        Log.Info($"Player name changed to: {newName}");
    }
}
