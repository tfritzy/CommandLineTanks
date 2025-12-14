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
}
