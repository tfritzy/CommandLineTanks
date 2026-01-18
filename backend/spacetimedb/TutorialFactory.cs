using SpacetimeDB;
using static Types;
using System;
using System.Linq;

public static partial class Module
{
    private const int TUTORIAL_WIDTH = 20;
    private const int TUTORIAL_HEIGHT = 12;
    private const int TUTORIAL_STARTING_HEALTH = 30;
    private const int TUTORIAL_SNIPER_AMMO = 1000;

    private static readonly (int x, int y) TUTORIAL_PLAYER_SPAWN = (3, 6);
    private static readonly (int x, int y) TUTORIAL_HEALTH_PICKUP = (6, 6);
    private static readonly (int x, int y) TUTORIAL_WEAPON_PICKUP = (9, 9);
    private static readonly (int x, int y) TUTORIAL_ENEMY_SPAWN = (16, 6);

    public static string GetTutorialGameId(Identity identity)
    {
        return $"tutorial_{identity.ToString().ToLower()}";
    }
}
