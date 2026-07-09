import { useState, useEffect, FormEvent } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { addHR, listHRs, removeHR, AddHRResponse, HRItem } from "../api/auth";
import { getAdminStats, AdminStats } from "../api/dashboard";
import StatCard from "../components/dashboard/StatCard";
import { createLogger } from "../utils/logger";

const log = createLogger("AdminDashboard");

const CHART_COLORS = {
  primary: "#2563eb",
  primaryLight: "#93bbfd",
  success: "#16a34a",
  warning: "#d97706",
  muted: "#94a3b8",
};

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [hrUsername, setHrUsername] = useState("");
  const [hrFullName, setHrFullName] = useState("");
  const [hrDesignation, setHrDesignation] = useState("");
  const [result, setResult] = useState<AddHRResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hrList, setHrList] = useState<HRItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const fetchHRs = async () => {
    try {
      setListLoading(true);
      const data = await listHRs();
      setHrList(data.hr_list);
      log.info(`Loaded ${data.hr_list.length} HR(s)`);
    } catch (err) {
      log.error("Failed to fetch HR list", err);
    } finally {
      setListLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      log.error("Failed to fetch admin stats", err);
    }
  };

  useEffect(() => {
    fetchHRs();
    fetchStats();
  }, []);

  const handleAddHR = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await addHR(hrUsername, hrFullName, hrDesignation);
      setResult(data);
      setHrUsername("");
      setHrFullName("");
      setHrDesignation("");
      log.info(`HR added: ${data.username}`);
      await fetchHRs();
      await fetchStats();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Failed to add HR");
      } else {
        setError("Failed to add HR. Please try again.");
      }
      log.error("Failed to add HR", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHR = async (hrId: string, username: string) => {
    if (!confirm(`Remove HR "${username}"? This cannot be undone.`)) return;

    try {
      await removeHR(hrId);
      log.info(`HR removed: ${username}`);
      await fetchHRs();
      await fetchStats();
    } catch (err) {
      log.error("Failed to remove HR", err);
      setError("Failed to remove HR.");
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Admin Dashboard</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {user?.company_name} - {user?.username}
          </p>
        </div>
        <button className="btn btn-outline" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="container" style={{ padding: "2rem" }}>
        {/* Stats Cards */}
        {stats && (
          <>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              <StatCard
                label="Total Employees"
                value={stats.headcount.total}
                subtitle="All users in company"
                color={CHART_COLORS.primary}
              />
              <StatCard
                label="HR Staff"
                value={stats.headcount.hr}
                subtitle="Human resources"
                color={CHART_COLORS.success}
              />
              <StatCard
                label="Employees"
                value={stats.headcount.employee}
                subtitle="Team members"
                color={CHART_COLORS.warning}
              />
              <StatCard
                label="Active Cycles"
                value={stats.cycle_summary.active}
                subtitle={`${stats.cycle_summary.completed} completed, ${stats.cycle_summary.draft} draft`}
                color="#8b5cf6"
              />
            </div>

            {/* Charts Row */}
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              {/* Designation Distribution */}
              {stats.designation_distribution.length > 0 && (
                <div className="card" style={{ flex: "1", minWidth: "400px" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Team by Designation
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={stats.designation_distribution}
                      layout="vertical"
                      margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        dataKey="designation"
                        type="category"
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill={CHART_COLORS.primary}
                        radius={[0, 4, 4, 0]}
                        name="Count"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Joining Trend */}
              {stats.joining_trend.length > 0 && (
                <div className="card" style={{ flex: "1", minWidth: "400px" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Hiring Trend (Last 12 Months)
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={stats.joining_trend}
                      margin={{ left: 0, right: 20, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={CHART_COLORS.success}
                        fill={CHART_COLORS.success}
                        fillOpacity={0.15}
                        name="Joins"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recent Hires */}
            {stats.recent_hires.length > 0 && (
              <div className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                  Recent Hires
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {stats.recent_hires.map((hire) => (
                    <div
                      key={hire.employee_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.6rem 1rem",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius)",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500 }}>{hire.full_name}</span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-muted)",
                            marginLeft: "0.5rem",
                          }}
                        >
                          ({hire.employee_id})
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                          {hire.designation}
                        </span>
                        {hire.date_of_joining && (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                            Joined {new Date(hire.date_of_joining).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* HR Management Section (existing) */}
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text-muted)" }}>
          HR Management
        </h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {/* Add HR Section */}
          <div className="card" style={{ flex: "1", minWidth: "320px", maxWidth: "450px" }}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Add HR Employee</h3>
            <form onSubmit={handleAddHR}>
              <div className="form-group">
                <label htmlFor="hrUsername">HR Username</label>
                <input
                  id="hrUsername"
                  type="text"
                  value={hrUsername}
                  onChange={(e) => setHrUsername(e.target.value)}
                  placeholder="Enter HR username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="hrFullName">Full Name</label>
                <input
                  id="hrFullName"
                  type="text"
                  value={hrFullName}
                  onChange={(e) => setHrFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hrDesignation">Designation</label>
                <input
                  id="hrDesignation"
                  type="text"
                  value={hrDesignation}
                  onChange={(e) => setHrDesignation(e.target.value)}
                  placeholder="Enter designation"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add HR"}
              </button>
            </form>

            {error && <p className="error-message" style={{ marginTop: "1rem" }}>{error}</p>}

            {result && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1.25rem",
                  background: "#f0fdf4",
                  borderRadius: "var(--radius)",
                  border: "1px solid #bbf7d0",
                }}
              >
                <p style={{ fontWeight: 600, color: "var(--color-success)", marginBottom: "0.75rem" }}>
                  HR Account Created Successfully
                </p>
                <p style={{ marginBottom: "0.5rem" }}>
                  <strong>Username:</strong> {result.username}
                </p>
                <p style={{ marginBottom: "0.75rem" }}>
                  <strong>Password:</strong>{" "}
                  <code
                    style={{
                      background: "#fef3c7",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      fontSize: "1rem",
                    }}
                  >
                    {result.generated_password}
                  </code>
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {result.message}
                </p>
              </div>
            )}
          </div>

          {/* HR List Section */}
          <div className="card" style={{ flex: "1", minWidth: "320px" }}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
              HR Employees ({hrList.length})
            </h3>

            {listLoading ? (
              <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
            ) : hrList.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)" }}>
                No HR employees added yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {hrList.map((hr) => (
                  <div
                    key={hr.id}
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
                      <p style={{ fontWeight: 500 }}>
                        {hr.full_name || hr.username}
                        <span style={{ fontSize: "0.8rem", color: "#666", marginLeft: "0.5rem" }}>
                          ({hr.employee_id})
                        </span>
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        @{hr.username} &middot; Added {new Date(hr.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="btn"
                      style={{
                        background: "#fef2f2",
                        color: "var(--color-error)",
                        border: "1px solid #fecaca",
                        padding: "0.4rem 0.75rem",
                        fontSize: "0.85rem",
                      }}
                      onClick={() => handleRemoveHR(hr.id, hr.username)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
