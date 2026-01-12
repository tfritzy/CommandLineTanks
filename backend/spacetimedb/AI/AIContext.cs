using SpacetimeDB;
using System;
using System.Collections.Generic;
using static Module;

public class AIContext
{
    private ReducerContext _ctx;
    private string _gameId;
    private List<FullTank> _allFullTanks;
    private List<Pickup> _allPickups;
    private TraversibilityMap? _traversibilityMap;
    private bool _traversibilityMapLoaded;
    private Dictionary<string, Module.TankPath?> _tankPaths;

    public AIContext(ReducerContext ctx, string gameId)
    {
        _ctx = ctx;
        _gameId = gameId;
        _allFullTanks = new List<FullTank>();
        _allPickups = new List<Pickup>();
        _tankPaths = new Dictionary<string, Module.TankPath?>();
    }

    public void Reset(ReducerContext ctx, string gameId)
    {
        _ctx = ctx;
        _gameId = gameId;
        _allFullTanks.Clear();
        _allPickups.Clear();
        _traversibilityMap = null;
        _traversibilityMapLoaded = false;
        _tankPaths.Clear();
    }

    public Random GetRandom()
    {
        return _ctx.Rng;
    }

    public List<FullTank> GetAllTanks()
    {
        if (_allFullTanks.Count == 0)
        {
            foreach (var tank in _ctx.Db.tank.GameId.Filter(_gameId))
            {
                var transform = _ctx.Db.tank_transform.TankId.Find(tank.Id);
                if (transform != null)
                {
                    _allFullTanks.Add(new FullTank(tank, transform.Value));
                }
            }
        }
        return _allFullTanks;
    }

    public List<Pickup> GetAllPickups()
    {
        if (_allPickups.Count == 0)
        {
            foreach (var pickup in _ctx.Db.pickup.GameId.Filter(_gameId))
            {
                _allPickups.Add(pickup);
            }
        }
        return _allPickups;
    }

    public TraversibilityMap? GetTraversibilityMap()
    {
        if (!_traversibilityMapLoaded)
        {
            _traversibilityMap = _ctx.Db.traversibility_map.GameId.Find(_gameId);
            _traversibilityMapLoaded = true;
        }
        return _traversibilityMap;
    }

    public Module.TankPath? GetTankPath(string tankId)
    {
        if (!_tankPaths.TryGetValue(tankId, out var path))
        {
            path = _ctx.Db.tank_path.TankId.Find(tankId);
            _tankPaths[tankId] = path;
        }

        return path;
    }

    public FullTank? GetClosestEnemyTank(FullTank sourceTank)
    {
        var tanks = GetAllTanks();
        FullTank? closestTank = null;
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
