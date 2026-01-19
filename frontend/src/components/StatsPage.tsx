import { useEffect, useState } from "react";
import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import DailyActiveUsersRow from "../../module_bindings/daily_active_users_type";
import { PALETTE } from "../theme/colors.config";

interface DailyStats {
  day: string;
  totalCount: number;
  newCount: number;
  returningCount: number;
  returningPercentage: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const connection = getConnection();

  useEffect(() => {
    if (!connection) {
      const sampleStats: DailyStats[] = [
        { day: "2026-01-15", totalCount: 45, newCount: 12, returningCount: 33, returningPercentage: 73.3 },
        { day: "2026-01-16", totalCount: 52, newCount: 8, returningCount: 44, returningPercentage: 84.6 },
        { day: "2026-01-17", totalCount: 38, newCount: 5, returningCount: 33, returningPercentage: 86.8 },
        { day: "2026-01-18", totalCount: 61, newCount: 15, returningCount: 46, returningPercentage: 75.4 },
        { day: "2026-01-19", totalCount: 48, newCount: 7, returningCount: 41, returningPercentage: 85.4 },
      ];
      setStats(sampleStats);
      setLoading(false);
      return;
    }

    const dailyActiveUsers = Array.from(connection.db.dailyActiveUsers.iter());
    
    const processedStats: DailyStats[] = dailyActiveUsers
      .map((entry: Infer<typeof DailyActiveUsersRow>) => {
        const returningCount = entry.totalCount - entry.newCount;
        const returningPercentage = entry.totalCount > 0 
          ? (returningCount / entry.totalCount) * 100 
          : 0;
        
        return {
          day: entry.day,
          totalCount: entry.totalCount,
          newCount: entry.newCount,
          returningCount,
          returningPercentage,
        };
      })
      .sort((a, b) => a.day.localeCompare(b.day));

    setStats(processedStats);
    setLoading(false);
  }, [connection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a24] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#707b89] border-t-[#fcfbf3] rounded-full animate-spin mb-4 mx-auto"></div>
          <span className="text-[#fcfbf3] font-medium uppercase tracking-widest text-sm">Loading Stats</span>
        </div>
      </div>
    );
  }

  const totalPlayers = stats.reduce((sum, s) => sum + s.totalCount, 0);
  const totalNewPlayers = stats.reduce((sum, s) => sum + s.newCount, 0);
  const totalReturningPlayers = stats.reduce((sum, s) => sum + s.returningCount, 0);
  const avgPlayersPerDay = stats.length > 0 ? Math.round(totalPlayers / stats.length) : 0;
  const avgNewPlayersPerDay = stats.length > 0 ? Math.round(totalNewPlayers / stats.length) : 0;
  const avgReturningPercentage = stats.length > 0
    ? stats.reduce((sum, s) => sum + s.returningPercentage, 0) / stats.length
    : 0;

  const maxTotalCount = Math.max(...stats.map(s => s.totalCount), 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a24] to-[#2e2e43] text-[#fcfbf3] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: PALETTE.WHITE_BRIGHT }}>
            Player Statistics
          </h1>
          <p className="text-lg" style={{ color: PALETTE.SLATE_LIGHT }}>
            Daily active user metrics and trends
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#2a2a3e] rounded-lg p-6 border border-[#42425a]">
            <div className="text-sm uppercase tracking-wider mb-2" style={{ color: PALETTE.SLATE_LIGHT }}>
              Total Players
            </div>
            <div className="text-4xl font-bold mb-1" style={{ color: PALETTE.BLUE_CYAN }}>
              {totalPlayers}
            </div>
            <div className="text-sm" style={{ color: PALETTE.SLATE_LIGHTER }}>
              {avgPlayersPerDay} avg per day
            </div>
          </div>

          <div className="bg-[#2a2a3e] rounded-lg p-6 border border-[#42425a]">
            <div className="text-sm uppercase tracking-wider mb-2" style={{ color: PALETTE.SLATE_LIGHT }}>
              New Players
            </div>
            <div className="text-4xl font-bold mb-1" style={{ color: PALETTE.GREEN_SUCCESS }}>
              {totalNewPlayers}
            </div>
            <div className="text-sm" style={{ color: PALETTE.SLATE_LIGHTER }}>
              {avgNewPlayersPerDay} avg per day
            </div>
          </div>

          <div className="bg-[#2a2a3e] rounded-lg p-6 border border-[#42425a]">
            <div className="text-sm uppercase tracking-wider mb-2" style={{ color: PALETTE.SLATE_LIGHT }}>
              Returning Players
            </div>
            <div className="text-4xl font-bold mb-1" style={{ color: PALETTE.YELLOW_BRIGHT }}>
              {totalReturningPlayers}
            </div>
            <div className="text-sm" style={{ color: PALETTE.SLATE_LIGHTER }}>
              {avgReturningPercentage.toFixed(1)}% avg return rate
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a3e] rounded-lg p-8 border border-[#42425a] mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: PALETTE.WHITE_BRIGHT }}>
            Players Per Day
          </h2>
          <div className="space-y-4">
            {stats.length === 0 ? (
              <div className="text-center py-12" style={{ color: PALETTE.SLATE_LIGHT }}>
                No data available yet
              </div>
            ) : (
              stats.map((stat) => {
                const barWidth = (stat.totalCount / maxTotalCount) * 100;
                const newWidth = (stat.newCount / maxTotalCount) * 100;
                
                return (
                  <div key={stat.day} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: PALETTE.SLATE_LIGHTER }}>
                        {stat.day}
                      </span>
                      <div className="flex gap-4 text-sm">
                        <span style={{ color: PALETTE.BLUE_CYAN }}>
                          Total: {stat.totalCount}
                        </span>
                        <span style={{ color: PALETTE.GREEN_SUCCESS }}>
                          New: {stat.newCount}
                        </span>
                        <span style={{ color: PALETTE.YELLOW_BRIGHT }}>
                          Returning: {stat.returningCount}
                        </span>
                        <span style={{ color: PALETTE.SLATE_LIGHT }}>
                          ({stat.returningPercentage.toFixed(1)}% return)
                        </span>
                      </div>
                    </div>
                    <div className="relative h-8 bg-[#1a1a24] rounded overflow-hidden">
                      <div
                        className="absolute h-full transition-all duration-300"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: PALETTE.BLUE_CYAN,
                          opacity: 0.3,
                        }}
                      />
                      <div
                        className="absolute h-full transition-all duration-300"
                        style={{
                          width: `${newWidth}%`,
                          backgroundColor: PALETTE.GREEN_SUCCESS,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[#2a2a3e] rounded-lg p-8 border border-[#42425a]">
          <h2 className="text-2xl font-bold mb-6" style={{ color: PALETTE.WHITE_BRIGHT }}>
            Daily Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#42425a]">
                  <th className="text-left py-3 px-4 text-sm uppercase tracking-wider" style={{ color: PALETTE.SLATE_LIGHT }}>
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm uppercase tracking-wider" style={{ color: PALETTE.SLATE_LIGHT }}>
                    Total
                  </th>
                  <th className="text-right py-3 px-4 text-sm uppercase tracking-wider" style={{ color: PALETTE.SLATE_LIGHT }}>
                    New
                  </th>
                  <th className="text-right py-3 px-4 text-sm uppercase tracking-wider" style={{ color: PALETTE.SLATE_LIGHT }}>
                    Returning
                  </th>
                  <th className="text-right py-3 px-4 text-sm uppercase tracking-wider" style={{ color: PALETTE.SLATE_LIGHT }}>
                    Return Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8" style={{ color: PALETTE.SLATE_LIGHT }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  stats.map((stat) => (
                    <tr key={stat.day} className="border-b border-[#42425a] hover:bg-[#34343e] transition-colors">
                      <td className="py-3 px-4" style={{ color: PALETTE.SLATE_LIGHTER }}>
                        {stat.day}
                      </td>
                      <td className="py-3 px-4 text-right font-medium" style={{ color: PALETTE.BLUE_CYAN }}>
                        {stat.totalCount}
                      </td>
                      <td className="py-3 px-4 text-right font-medium" style={{ color: PALETTE.GREEN_SUCCESS }}>
                        {stat.newCount}
                      </td>
                      <td className="py-3 px-4 text-right font-medium" style={{ color: PALETTE.YELLOW_BRIGHT }}>
                        {stat.returningCount}
                      </td>
                      <td className="py-3 px-4 text-right font-medium" style={{ color: PALETTE.SLATE_LIGHTER }}>
                        {stat.returningPercentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 rounded font-bold uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: PALETTE.BLUE_MEDIUM,
              color: PALETTE.WHITE_BRIGHT,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = PALETTE.BLUE_LIGHT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = PALETTE.BLUE_MEDIUM;
            }}
          >
            Back to Game
          </a>
        </div>
      </div>
    </div>
  );
}
