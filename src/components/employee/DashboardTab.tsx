import { useState, useEffect } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { getEmployeeStats, EmployeeStats } from "../../api/dashboard";
import StatCard from "../dashboard/StatCard";
import StatusBadge from "../dashboard/StatusBadge";
import { createLogger } from "../../utils/logger";

const log = createLogger("DashboardTab");

const CHART_COLORS = {
  primary: "#2563eb",
  success: "#16a34a",
  warning: "#d97706",
  purple: "#8b5cf6",
};

function shortenCategory(name: string): string {
  const map: Record<string, string> = {
    "AI Adoption and Responsible Usage": "AI Adoption",
    "Managing Processes and Work": "Process Mgmt",
    "Responsibilities and Trust": "Responsibility",
    "Energy and Drive": "Energy & Drive",
  };
  return map[name] || name;
}

export default function DashboardTab() {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getEmployeeStats();
        setStats(data);
      } catch (err) {
        log.error("Failed to load employee stats", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Loading dashboard...</p>;
  }

  if (!stats) {
    return <p style={{ color: "var(--color-text-muted)" }}>Failed to load dashboard data.</p>;
  }

  const radarData = stats.my_ratings.map((r) => ({
    category: shortenCategory(r.category),
    rating: r.avg_rating,
    fullMark: 10,
  }));

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>My Dashboard</h2>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <StatCard
          label="Total Appraisals"
          value={stats.my_summary.total_appraisals}
          subtitle="All cycles"
          color={CHART_COLORS.primary}
        />
        <StatCard
          label="Completed"
          value={stats.my_summary.completed}
          subtitle="Finished cycles"
          color={CHART_COLORS.success}
        />
        <StatCard
          label="In Progress"
          value={stats.my_summary.in_progress}
          subtitle="Active cycles"
          color={CHART_COLORS.warning}
        />
      </div>

      {/* Radar Chart + Upcoming Meetings */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {radarData.length > 0 && (
          <div className="card" style={{ flex: "1", minWidth: "380px" }}>
            <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>
              My Performance Profile
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
              Average ratings across completed appraisals
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "var(--color-text)" }}
                />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Rating"
                  dataKey="rating"
                  stroke={CHART_COLORS.primary}
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip formatter={(v: number) => v.toFixed(1)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card" style={{ flex: "1", minWidth: "320px" }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
            Upcoming Meetings
          </h3>
          {stats.upcoming_meetings.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              No upcoming meetings scheduled.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {stats.upcoming_meetings.map((m) => (
                <div
                  key={m.participant_id}
                  style={{
                    padding: "0.6rem 0.75rem",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                      {m.employee_name}
                    </p>
                    <span style={{ fontSize: "0.8rem", color: CHART_COLORS.purple, fontWeight: 500 }}>
                      {new Date(m.meeting_time).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                    {m.cycle_name}
                    {m.lead_name && ` · Lead: ${m.lead_name}`}
                    {m.hr_name && ` · HR: ${m.hr_name}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cycle History */}
      {stats.my_cycle_history.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
            Appraisal History
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {stats.my_cycle_history.map((cycle) => (
              <div
                key={`${cycle.cycle_name}-${cycle.period_from}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius)",
                }}
              >
                <div>
                  <p style={{ fontWeight: 500 }}>{cycle.cycle_name}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                    {cycle.period_from} to {cycle.period_to}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {cycle.overall_avg_rating !== null && (
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: cycle.overall_avg_rating >= 7 ? CHART_COLORS.success : cycle.overall_avg_rating >= 5 ? CHART_COLORS.warning : "var(--color-error)",
                      }}
                    >
                      {cycle.overall_avg_rating.toFixed(1)}/10
                    </span>
                  )}
                  <StatusBadge status={cycle.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
