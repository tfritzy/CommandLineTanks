using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void say(ReducerContext ctx, string gameId, string message)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        if (string.IsNullOrWhiteSpace(message))
        {
            Log.Error("Message cannot be empty");
            return;
        }

        if (message.Length > 200)
        {
            Log.Error("Message too long: maximum 200 characters");
            return;
        }

        if (message.Contains("<") || message.Contains(">"))
        {
            Log.Error("Message contains invalid characters");
            return;
        }

        var newMessage = new Message
        {
            Id = Guid.NewGuid().ToString(),
            GameId = gameId,
            Sender = player.Value.Name ?? "Anonymous",
            SenderIdentity = ctx.Sender,
            Text = message,
            Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        ctx.Db.message.Insert(newMessage);
        Log.Info($"{player.Value.Name}: {message}");
    }
}
