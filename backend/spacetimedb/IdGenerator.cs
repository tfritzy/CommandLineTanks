using SpacetimeDB;

public static partial class Module
{
    internal static string GenerateId(ReducerContext ctx, string prefix)
    {
        var timestampMicros = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;

        var random = ctx.Rng;
        var randomBytes = new byte[12];
        random.NextBytes(randomBytes);

        const string chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        var result = new char[16];

        ulong combined = timestampMicros;
        for (int i = 0; i < 8; i++)
        {
            combined ^= ((ulong)randomBytes[i] << (i * 8));
        }

        for (int i = 0; i < 16; i++)
        {
            result[i] = chars[(int)(combined % (ulong)chars.Length)];
            combined /= (ulong)chars.Length;
            if (combined == 0 && i < 15)
            {
                for (int j = 8; j < randomBytes.Length && i < 15; j++, i++)
                {
                    result[i + 1] = chars[randomBytes[j] % chars.Length];
                }
                break;
            }
        }

        return $"{prefix}_{new string(result)}";
    }

    internal static string GenerateWorldId(ReducerContext ctx)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz";
        const int maxAttempts = 100;
        
        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            var result = new char[4];
            for (int i = 0; i < 4; i++)
            {
                result[i] = chars[ctx.Rng.Next(chars.Length)];
            }
            
            var worldId = new string(result);
            var existing = ctx.Db.world.Id.Find(worldId);
            if (existing == null)
            {
                return worldId;
            }
        }
        
        Log.Error("Failed to generate unique world ID after 100 attempts");
        return new string(chars[ctx.Rng.Next(chars.Length)], 4);
    }
}
