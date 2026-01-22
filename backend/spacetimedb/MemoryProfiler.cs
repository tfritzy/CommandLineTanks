using System;
using System.Collections.Generic;
using System.Linq;

public static class MemoryProfiler
{
    private static Dictionary<string, MemoryStats> _stats = new Dictionary<string, MemoryStats>();
    private static ulong _lastLogTimestampMicros = 0;
    private const ulong LOG_INTERVAL_MICROS = 1_000_000;

    private class MemoryStats
    {
        public long TotalAllocated;
        public int Count;
    }

    public static void ProfileMemory(string name, Action action, ulong currentTimestampMicros)
    {
        long memoryBefore = GC.GetTotalMemory(false);
        
        action();
        
        long memoryAfter = GC.GetTotalMemory(false);
        long allocated = Math.Max(0, memoryAfter - memoryBefore);

        if (!_stats.ContainsKey(name))
        {
            _stats[name] = new MemoryStats();
        }

        _stats[name].TotalAllocated += allocated;
        _stats[name].Count++;

        if (currentTimestampMicros - _lastLogTimestampMicros >= LOG_INTERVAL_MICROS)
        {
            LogResults();
            Reset();
            _lastLogTimestampMicros = currentTimestampMicros;
        }
    }

    private static void LogResults()
    {
        if (_stats.Count == 0) return;

        Console.WriteLine("--- Memory Profiler Results ---");
        
        var sorted = _stats.OrderByDescending(kvp => kvp.Value.TotalAllocated).ToList();

        long totalAllocatedPerCall = 0;
        foreach (var kvp in sorted)
        {
            long avgBytes = kvp.Value.TotalAllocated / kvp.Value.Count;
            double avgKB = avgBytes / 1024.0;
            double totalKB = kvp.Value.TotalAllocated / 1024.0;
            Console.WriteLine($"{kvp.Key.PadRight(30)}: {avgKB:F2} KB (avg) | {totalKB:F2} KB (total) | {kvp.Value.Count} calls");
            totalAllocatedPerCall += avgBytes;
        }
        
        Console.WriteLine($"Total Allocated (avg/call): {(totalAllocatedPerCall / 1024.0):F2} KB");
        Console.WriteLine("-------------------------------");
    }

    private static void Reset()
    {
        _stats.Clear();
    }
}
