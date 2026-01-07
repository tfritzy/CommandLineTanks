using SpacetimeDB;
using System;
using System.Collections.Generic;
using System.Linq;
using static Module;

public class AIContext
{
    private readonly ReducerContext _ctx;
    private readonly string _worldId;
    private List<Tank>? _allTanks;
    private List<Pickup>? _allPickups;
    private TraversibilityMap? _traversibilityMap;
    private bool _traversibilityMapLoaded;
    private Dictionary<string, Module.TankPath?>? _tankPaths;

    public AIContext(ReducerContext ctx, string worldId)
    {
        _ctx = ctx;
        _worldId = worldId;
    }

    public Random GetRandom()
    {
        return _ctx.Rng;
    }

    public List<Tank> GetAllTanks()
    {
        return _allTanks ??= _ctx.Db.tank.WorldId.Filter(_worldId).ToList();
    }

    public List<Pickup> GetAllPickups()
    {
        return _allPickups ??= _ctx.Db.pickup.WorldId.Filter(_worldId).ToList();
    }

    public TraversibilityMap? GetTraversibilityMap()
    {
        if (!_traversibilityMapLoaded)
        {
            _traversibilityMap = _ctx.Db.traversibility_map.WorldId.Find(_worldId);
            _traversibilityMapLoaded = true;
        }
        return _traversibilityMap;
    }

    public Module.TankPath? GetTankPath(string tankId)
    {
        _tankPaths ??= new Dictionary<string, Module.TankPath?>();

        if (!_tankPaths.TryGetValue(tankId, out var path))
        {
            path = _ctx.Db.tank_path.TankId.Find(tankId);
            _tankPaths[tankId] = path;
        }

        return path;
    }

    public Tank? GetClosestEnemyTank(Tank sourceTank)
    {
        var tanks = GetAllTanks();
        Tank? closestTank = null;
        float closestDistanceSquared = float.MaxValue;

        foreach (var tank in tanks)
        {
            if (tank.Id == sourceTank.Id || tank.Alliance == sourceTank.Alliance || tank.Health <= 0)
            {
                continue;
            }

            float dx = tank.PositionX - sourceTank.PositionX;
            float dy = tank.PositionY - sourceTank.PositionY;
            float distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < closestDistanceSquared)
            {
                closestDistanceSquared = distanceSquared;
                closestTank = tank;
            }
        }

        return closestTank;
    }
}
