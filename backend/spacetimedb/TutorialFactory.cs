using SpacetimeDB;
using static Types;
using System;
using System.Linq;

public static partial class Module
{
    public static string GetTutorialGameId(Identity identity)
    {
        return $"tutorial_{identity.ToString().ToLower()}";
    }
}
