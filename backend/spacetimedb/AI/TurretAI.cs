using SpacetimeDB;
using static Types;
using System;
using System.Linq;
using static Module;

public static partial class TurretAI
{
    private const int TILE_SIZE = 6;
    private const float AIM_TOLERANCE = 0.05f;

    public static Tank EvaluateAndMutateTank(ReducerContext ctx, FullTank fullTank, AIContext aiContext, int tickCount)
    {
        var tank = fullTank.Tank;
        bool targetJustSelected = false;
        if (tank.Target == null)
        {
            tank = SelectNewTarget(ctx, fullTank, tank, aiContext);
            if (tank.Target != null) targetJustSelected = true;
        }
        else
        {
            var targetTank = ctx.Db.tank.Id.Find(tank.Target);
            if (targetTank == null || targetTank.Value.Health <= 0)
            {
                tank = SelectNewTarget(ctx, fullTank, tank, aiContext);
                if (tank.Target != null) targetJustSelected = true;
            }
        }

        if (tank.Target != null && !targetJustSelected)
        {
            float angleDiff = Math.Abs(GetNormalizedAngleDifference(fullTank.TargetTurretRotation, fullTank.TurretRotation));
            if (angleDiff < AIM_TOLERANCE)
            {
                tank = FireTankWeapon(ctx, tank) with
                {
                    Message = "fire"
                };
            }
        }

        return tank;
    }

    private static Tank SelectNewTarget(ReducerContext ctx, FullTank fullTank, Tank tank, AIContext aiContext)
    {
        int turretTileX = (int)fullTank.PositionX / TILE_SIZE;
        int turretTileY = (int)fullTank.PositionY / TILE_SIZE;

        var allTanks = aiContext.GetAllTanks();
        
        int validTargetCount = 0;
        FullTank? firstValidTarget = null;
        
        foreach (var t in allTanks)
        {
            if (t.Id == fullTank.Id || t.Health <= 0 || t.Alliance == fullTank.Alliance)
                continue;
                
            int tankTileX = (int)t.PositionX / TILE_SIZE;
            int tankTileY = (int)t.PositionY / TILE_SIZE;
            
            if (tankTileX == turretTileX && tankTileY == turretTileY)
            {
                validTargetCount++;
                if (firstValidTarget == null)
                {
                    firstValidTarget = t;
                }
            }
        }

        Tank updatedTank = tank;

        if (validTargetCount > 0)
        {
            FullTank targetFullTank;
            if (validTargetCount == 1)
            {
                targetFullTank = firstValidTarget.Value;
            }
            else
            {
                int targetIndex = aiContext.GetRandom().Next(validTargetCount);
                int currentIndex = 0;
                targetFullTank = firstValidTarget.Value;
                
                foreach (var t in allTanks)
                {
                    if (t.Id == fullTank.Id || t.Health <= 0 || t.Alliance == fullTank.Alliance)
                        continue;
                        
                    int tankTileX = (int)t.PositionX / TILE_SIZE;
                    int tankTileY = (int)t.PositionY / TILE_SIZE;
                    
                    if (tankTileX == turretTileX && tankTileY == turretTileY)
                    {
                        if (currentIndex == targetIndex)
                        {
                            targetFullTank = t;
                            break;
                        }
                        currentIndex++;
                    }
                }
            }
            
            updatedTank = TargetTankByCode(ctx, tank, targetFullTank.TargetCode);
            updatedTank = updatedTank with
            {
                Message = $"target {targetFullTank.TargetCode}"
            };
        }
        else
        {
            updatedTank = tank with { Target = null };
        }

        return updatedTank;
    }

    private static bool IsInSameTile(FullTank tank1, FullTank tank2)
    {
        int tank1TileX = (int)tank1.PositionX / TILE_SIZE;
        int tank1TileY = (int)tank1.PositionY / TILE_SIZE;
        int tank2TileX = (int)tank2.PositionX / TILE_SIZE;
        int tank2TileY = (int)tank2.PositionY / TILE_SIZE;

        return tank1TileX == tank2TileX && tank1TileY == tank2TileY;
    }
}
