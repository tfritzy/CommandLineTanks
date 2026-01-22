using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;

public static class MemoryProfiler
{
    private static ConcurrentDictionary<string, MemoryStats> _stats = new ConcurrentDictionary<string, MemoryStats>();
    private static long _lastLogTimestampMicros = 0;
    private const ulong LOG_INTERVAL_MICROS = 1_000_000;

    private class MemoryStats
    {
        public long TotalAllocated;
        public int Count;

        public void AddAllocation(long bytes)
        {
            Interlocked.Add(ref TotalAllocated, bytes);
            Interlocked.Increment(ref Count);
        }
    }

    public static void ProfileMemory(string name, Action action, ulong currentTimestampMicros)
    {
        long allocationsBefore = GC.GetTotalAllocatedBytes(false);
        
        action();
        
        long allocationsAfter = GC.GetTotalAllocatedBytes(false);
        long allocated = Math.Max(0, allocationsAfter - allocationsBefore);

        var stats = _stats.GetOrAdd(name, _ => new MemoryStats());
        stats.AddAllocation(allocated);

        long lastLogTime = Interlocked.Read(ref _lastLogTimestampMicros);
        if (currentTimestampMicros - (ulong)lastLogTime >= LOG_INTERVAL_MICROS)
        {
            if (Interlocked.CompareExchange(ref _lastLogTimestampMicros, (long)currentTimestampMicros, lastLogTime) == lastLogTime)
            {
                LogResults();
                Reset();
            }
        }
    }

    private static void LogResults()
    {
        if (_stats.IsEmpty) return;

        Console.WriteLine("--- Memory Profiler Results ---");
        
        var snapshot = _stats.ToArray();
        var sorted = snapshot.OrderByDescending(kvp => kvp.Value.TotalAllocated).ToList();

        long totalAllocatedPerCall = 0;
        foreach (var kvp in sorted)
        {
            int count = kvp.Value.Count;
            if (count == 0) continue;

            long avgBytes = kvp.Value.TotalAllocated / count;
            double avgKB = avgBytes / 1024.0;
            double totalKB = kvp.Value.TotalAllocated / 1024.0;
            Console.WriteLine($"{kvp.Key.PadRight(30)}: {avgKB:F2} KB (avg) | {totalKB:F2} KB (total) | {count} calls");
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
