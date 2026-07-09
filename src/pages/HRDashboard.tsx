import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  listCycles,
  createCycle,
  startCycle,
  listParticipants,
  addParticipants,
  proceedParticipant,
  scheduleMeeting,
  listEmployees,
  addEmployee,
  getEmployeeDetail,
  removeEmployee,
  getParticipantAppraisalDetails,
  Cycle,
  Participant,
  EmployeeItem,
  EmployeeDetailResponse,
  AddEmployeeResponse,
} from "../api/cycles";
import { AppraisalDetails } from "../api/employee";
import { getHRStats, HRStats } from "../api/dashboard";
import StatCard from "../components/dashboard/StatCard";
import { createLogger } from "../utils/logger";

const log = createLogger("hr-dashboard");

type Tab = "overview" | "cycles" | "employees";

const CHART_COLORS = {
  primary: "#2563eb",
  success: "#16a34a",
  warning: "#d97706",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  rose: "#e11d48",
  amber: "#f59e0b",
  emerald: "#10b981",
  indigo: "#6366f1",
};

const PIE_COLORS = ["#2563eb", "#16a34a", "#d97706", "#8b5cf6", "#06b6d4", "#e11d48", "#f59e0b", "#10b981", "#6366f1", "#94a3b8"];

const STATUS_COLORS: Record<string, string> = {
  pending_self_appraisal: "#f59e0b",
  self_appraisal_submitted: "#06b6d4",
  lead_reviewing: "#2563eb",
  lead_reviewed: "#10b981",
  meeting_scheduled: "#8b5cf6",
  completed: "#16a34a",
};

const statusLabels: Record<string, string> = {
  pending_self_appraisal: "Pending Self Appraisal",
  self_appraisal_submitted: "Self Appraisal Submitted",
  hr_reviewed: "HR Reviewed",
  lead_reviewing: "Lead Reviewing",
  lead_reviewed: "Lead Reviewed",
  meeting_scheduled: "Meeting Scheduled",
  completed: "Completed",
};

function HRDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [hrStats, setHRStats] = useState<HRStats | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCycle, setNewCycle] = useState({ name: "", period_from: "", period_to: "" });
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [meetingModal, setMeetingModal] = useState<{ participantId: string; open: boolean }>({
    participantId: "",
    open: false,
  });
  const [meetingTime, setMeetingTime] = useState("");
  const [error, setError] = useState("");

  // Add employee form
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    username: "",
    full_name: "",
    designation: "",
    date_of_joining: "",
    skillset: "",
  });
  const [addedEmployeeResult, setAddedEmployeeResult] = useState<AddEmployeeResponse | null>(null);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [viewFormData, setViewFormData] = useState<AppraisalDetails | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);

  async function loadHRStats() {
    try {
      const data = await getHRStats();
      setHRStats(data);
    } catch (err) {
      log.error("Failed to load HR stats", err);
    }
  }

  useEffect(() => {
    loadCycles();
    loadEmployees();
    loadHRStats();
  }, []);

  async function loadCycles() {
    try {
      const res = await listCycles();
      setCycles(res.cycles);
    } catch (err) {
      log.error("Failed to load cycles", err);
    }
  }

  async function loadEmployees() {
    try {
      const res = await listEmployees();
      setEmployees(res.employees);
    } catch (err) {
      log.error("Failed to load employees", err);
    }
  }

  async function handleCreateCycle(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = await createCycle(newCycle);
      setShowCreateForm(false);
      setNewCycle({ name: "", period_from: "", period_to: "" });
      await loadCycles();
      await handleSelectCycle(created);
      log.info("Cycle created: %s", created.name);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create cycle");
    }
  }

  async function handleStartCycle(cycleId: string) {
    try {
      await startCycle(cycleId);
      await loadCycles();
      if (selectedCycle?.id === cycleId) {
        setSelectedCycle({ ...selectedCycle, status: "active" });
      }
      log.info("Cycle started: %s", cycleId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start cycle");
    }
  }

  async function handleSelectCycle(cycle: Cycle) {
    setSelectedCycle(cycle);
    setSelectedEmployeeIds([]);
    try {
      const res = await listParticipants(cycle.id);
      setParticipants(res.participants);
    } catch (err) {
      log.error("Failed to load participants", err);
    }
  }

  async function handleAddParticipants() {
    if (!selectedCycle || selectedEmployeeIds.length === 0) return;
    setError("");
    try {
      await addParticipants(selectedCycle.id, selectedEmployeeIds);
      setSelectedEmployeeIds([]);
      const res = await listParticipants(selectedCycle.id);
      setParticipants(res.participants);
      log.info("Added participants to cycle %s", selectedCycle.name);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add participants");
    }
  }

  async function handleProceed(participantId: string) {
    setError("");
    try {
      await proceedParticipant(participantId);
      if (selectedCycle) {
        const res = await listParticipants(selectedCycle.id);
        setParticipants(res.participants);
      }
      log.info("Proceeded participant %s to lead review", participantId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to proceed");
    }
  }

  async function handleScheduleMeeting() {
    if (!meetingModal.participantId || !meetingTime) return;
    setError("");
    try {
      await scheduleMeeting(meetingModal.participantId, user?.id || "", meetingTime);
      setMeetingModal({ participantId: "", open: false });
      setMeetingTime("");
      if (selectedCycle) {
        const res = await listParticipants(selectedCycle.id);
        setParticipants(res.participants);
      }
      log.info("Meeting scheduled for participant %s", meetingModal.participantId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to schedule meeting");
    }
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAddingEmployee(true);
    setAddedEmployeeResult(null);
    try {
      const result = await addEmployee({
        username: newEmployee.username,
        full_name: newEmployee.full_name,
        designation: newEmployee.designation,
        date_of_joining: newEmployee.date_of_joining || undefined,
        skillset: newEmployee.skillset || undefined,
      });
      setAddedEmployeeResult(result);
      setNewEmployee({ username: "", full_name: "", designation: "", date_of_joining: "", skillset: "" });
      await loadEmployees();
      log.info("Employee added: %s", result.username);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add employee");
    } finally {
      setAddingEmployee(false);
    }
  }

  async function handleViewEmployee(empId: string) {
    setLoadingDetail(true);
    try {
      const detail = await getEmployeeDetail(empId);
      setSelectedEmployee(detail);
    } catch (err) {
      log.error("Failed to load employee detail", err);
      setError("Failed to load employee details");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleViewForm(participantId: string) {
    setLoadingForm(true);
    try {
      const data = await getParticipantAppraisalDetails(participantId);
      setViewFormData(data);
    } catch (err) {
      log.error("Failed to load appraisal form", err);
      setError("Failed to load appraisal form");
    } finally {
      setLoadingForm(false);
    }
  }

  async function handleRemoveEmployee(empId: string) {
    setError("");
    try {
      await removeEmployee(empId);
      setSelectedEmployee(null);
      setConfirmRemove(null);
      await loadEmployees();
      log.info("Employee removed: %s", empId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to remove employee");
    }
  }

  function toggleEmployeeSelection(empId: string) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  }

  const participantEmployeeIds = new Set(participants.map((p) => p.employee_id));
  const availableForCycle = employees.filter(
    (emp) => emp.role === "employee" && !participantEmployeeIds.has(emp.id)
  );
  const companyEmployees = employees.filter((emp) => emp.role === "employee");

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
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>HR Dashboard</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
            {user?.company_name} - {user?.username}
          </p>
        </div>
        <button className="btn btn-outline" onClick={logout}>
          Logout
        </button>
      </header>

      <nav
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "0 2rem",
        }}
      >
        {([
          { key: "overview" as Tab, label: "Overview" },
          { key: "cycles" as Tab, label: "Appraisal Cycles" },
          { key: "employees" as Tab, label: "Employees" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              background: "none",
              borderBottom: activeTab === key ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === key ? "var(--color-primary)" : "var(--color-text-muted)",
              fontWeight: activeTab === key ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <main style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        {error && (
          <div style={{ background: "#f8d7da", color: "#721c24", padding: "0.75rem", borderRadius: 4, marginBottom: "1rem" }}>
            {error}
            <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer" }}>
              &times;
            </button>
          </div>
        )}

        {activeTab === "overview" && hrStats && (
          <div>
            {/* Stat Cards */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              <StatCard
                label="Total Employees"
                value={hrStats.headcount.total_employees}
                subtitle="All company members"
                color={CHART_COLORS.primary}
              />
              <StatCard
                label="Active Cycles"
                value={hrStats.headcount.active_cycles}
                subtitle="In progress"
                color={CHART_COLORS.success}
              />
              <StatCard
                label="Completion Rate"
                value={
                  hrStats.completion_rate.length > 0
                    ? `${hrStats.completion_rate[0].percentage}%`
                    : "N/A"
                }
                subtitle={
                  hrStats.completion_rate.length > 0
                    ? `${hrStats.completion_rate[0].completed_count}/${hrStats.completion_rate[0].total_count} in ${hrStats.completion_rate[0].cycle_name}`
                    : "No cycles yet"
                }
                color={CHART_COLORS.purple}
              />
            </div>

            {/* Cycle Progress + Avg Ratings */}
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              {hrStats.active_cycle_progress.length > 0 && (
                <div className="card" style={{ flex: "1", minWidth: "400px" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Cycle Progress
                  </h3>
                  {hrStats.active_cycle_progress.map((cycle) => {
                    const chartData = cycle.status_breakdown.map((s) => ({
                      name: s.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                      value: s.count,
                      status: s.status,
                    }));
                    return (
                      <div key={cycle.cycle_name} style={{ marginBottom: "1.5rem" }}>
                        <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                          {cycle.cycle_name}
                          <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>
                            ({cycle.total_participants} participants)
                          </span>
                        </p>
                        <ResponsiveContainer width="100%" height={40}>
                          <BarChart
                            data={[chartData.reduce((acc, item) => ({ ...acc, [item.status]: item.value }), {} as Record<string, number>)]}
                            layout="horizontal"
                            barSize={28}
                          >
                            {chartData.map((item) => (
                              <Bar
                                key={item.status}
                                dataKey={item.status}
                                stackId="a"
                                fill={STATUS_COLORS[item.status] || "#94a3b8"}
                                name={item.name}
                              />
                            ))}
                            <Tooltip />
                          </BarChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                          {chartData.map((item) => (
                            <div key={item.status} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }}>
                              <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[item.status] || "#94a3b8" }} />
                              <span>{item.name}: {item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hrStats.avg_ratings_by_category.length > 0 && (
                <div className="card" style={{ flex: "1", minWidth: "400px" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Average Ratings by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={hrStats.avg_ratings_by_category}
                      layout="vertical"
                      margin={{ left: 30, right: 20, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 10]} />
                      <YAxis
                        dataKey="category"
                        type="category"
                        width={180}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip formatter={(v: number) => v.toFixed(1)} />
                      <Bar dataKey="avg_rating" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} name="Avg Rating" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Performers + Upcoming Meetings */}
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              {hrStats.top_performers.length > 0 && (
                <div className="card" style={{ flex: "1", minWidth: "350px" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Top Performers
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {hrStats.top_performers.map((tp, i) => (
                      <div
                        key={tp.employee_id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: i === 0 ? "#fef3c7" : i === 1 ? "#f3f4f6" : i === 2 ? "#fed7aa" : "#f1f5f9",
                              color: i === 0 ? "#92400e" : i === 1 ? "#374151" : i === 2 ? "#9a3412" : "#64748b",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                            }}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>{tp.employee_name}</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{tp.designation}</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: CHART_COLORS.primary, fontSize: "1rem" }}>
                          {tp.avg_rating.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card" style={{ flex: "1", minWidth: "350px" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                  Upcoming Meetings
                </h3>
                {hrStats.upcoming_meetings.length === 0 ? (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>No upcoming meetings scheduled.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {hrStats.upcoming_meetings.map((m) => (
                      <div
                        key={m.participant_id}
                        style={{
                          padding: "0.6rem 0.75rem",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>{m.employee_name}</p>
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

            {/* Distribution Charts */}
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              {hrStats.designation_distribution.length > 0 && (
                <div className="card" style={{ flex: "1", minWidth: "350px" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Designation Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={hrStats.designation_distribution.map((d) => ({ name: d.designation, value: d.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {hrStats.designation_distribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {hrStats.skillset_distribution.length > 0 && (
                <div className="card" style={{ flex: "1", minWidth: "350px" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Skillset Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={hrStats.skillset_distribution.map((s) => ({ name: s.skillset, value: s.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name.substring(0, 20)}${name.length > 20 ? "..." : ""} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {hrStats.skillset_distribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "employees" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ margin: 0 }}>Company Employees</h2>
                <p style={{ margin: "0.25rem 0 0", color: "#666", fontSize: "0.9rem" }}>
                  Add new employees when they join the company
                </p>
              </div>
              <button
                onClick={() => { setShowAddEmployee(!showAddEmployee); setAddedEmployeeResult(null); }}
                style={{ padding: "0.5rem 1rem", background: "#28a745", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
              >
                + Add Employee
              </button>
            </div>

            {showAddEmployee && (
              <form
                onSubmit={handleAddEmployee}
                style={{ background: "#fff", padding: "1.25rem", borderRadius: 8, marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
              >
                <h3 style={{ marginTop: 0 }}>New Employee Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.9rem" }}>Username *</label>
                    <input
                      type="text"
                      value={newEmployee.username}
                      onChange={(e) => setNewEmployee((p) => ({ ...p, username: e.target.value }))}
                      required
                      placeholder="login username"
                      style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.9rem" }}>Full Name *</label>
                    <input
                      type="text"
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee((p) => ({ ...p, full_name: e.target.value }))}
                      required
                      placeholder="John Doe"
                      style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.9rem" }}>Designation *</label>
                    <input
                      type="text"
                      value={newEmployee.designation}
                      onChange={(e) => setNewEmployee((p) => ({ ...p, designation: e.target.value }))}
                      required
                      placeholder="Software Engineer"
                      style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.9rem" }}>Date of Joining</label>
                    <input
                      type="date"
                      value={newEmployee.date_of_joining}
                      onChange={(e) => setNewEmployee((p) => ({ ...p, date_of_joining: e.target.value }))}
                      style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.9rem" }}>Skillset</label>
                    <input
                      type="text"
                      value={newEmployee.skillset}
                      onChange={(e) => setNewEmployee((p) => ({ ...p, skillset: e.target.value }))}
                      placeholder="Python, React, etc."
                      style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4 }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addingEmployee}
                  style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", background: addingEmployee ? "#999" : "#28a745", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  {addingEmployee ? "Adding..." : "Create Employee Account"}
                </button>
              </form>
            )}

            {addedEmployeeResult && (
              <div style={{ background: "#d4edda", color: "#155724", padding: "1rem", borderRadius: 6, marginBottom: "1.5rem" }}>
                <strong>Employee account created</strong>
                <p style={{ margin: "0.5rem 0" }}>Username: {addedEmployeeResult.username} | Employee ID: {addedEmployeeResult.employee_id}</p>
                <p style={{ margin: "0.5rem 0" }}>
                  Password: <code style={{ background: "#fff", padding: "0.2rem 0.5rem", borderRadius: 3 }}>{addedEmployeeResult.generated_password}</code>
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem" }}>{addedEmployeeResult.message}</p>
              </div>
            )}

            {companyEmployees.length === 0 ? (
              <p style={{ color: "#666" }}>No employees added yet. Click "Add Employee" to onboard a new team member.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {companyEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleViewEmployee(emp.id)}
                    style={{
                      background: "#fff",
                      padding: "1rem",
                      borderRadius: 6,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      display: "flex",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "box-shadow 0.15s",
                      border: "1px solid #eee",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)")}
                  >
                    <div>
                      <strong>{emp.full_name || emp.username}</strong>
                      <span style={{ marginLeft: "0.5rem", color: "#666", fontSize: "0.85rem" }}>({emp.employee_id})</span>
                      <p style={{ margin: "0.25rem 0 0", color: "#666", fontSize: "0.85rem" }}>
                        {emp.designation} &middot; @{emp.username}
                      </p>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#999" }}>
                      Joined {new Date(emp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Employee Detail Modal */}
        {(selectedEmployee || loadingDetail) && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) { setSelectedEmployee(null); setConfirmRemove(null); } }}
          >
            <div style={{ background: "#fff", borderRadius: 10, width: 650, maxHeight: "85vh", overflow: "auto", padding: "2rem" }}>
              {loadingDetail ? (
                <p style={{ textAlign: "center", padding: "2rem" }}>Loading employee details...</p>
              ) : selectedEmployee ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                    <div>
                      <h2 style={{ margin: 0 }}>{selectedEmployee.full_name}</h2>
                      <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
                        {selectedEmployee.designation} &middot; {selectedEmployee.employee_id} &middot; @{selectedEmployee.username}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedEmployee(null); setConfirmRemove(null); }}
                      style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" }}
                    >
                      &times;
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ background: "#f8f9fa", padding: "0.75rem", borderRadius: 6 }}>
                      <span style={{ fontSize: "0.8rem", color: "#666" }}>Role</span>
                      <p style={{ margin: "0.25rem 0 0", fontWeight: 500, textTransform: "capitalize" }}>{selectedEmployee.role}</p>
                    </div>
                    <div style={{ background: "#f8f9fa", padding: "0.75rem", borderRadius: 6 }}>
                      <span style={{ fontSize: "0.8rem", color: "#666" }}>Date of Joining</span>
                      <p style={{ margin: "0.25rem 0 0", fontWeight: 500 }}>{selectedEmployee.date_of_joining ? new Date(selectedEmployee.date_of_joining).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div style={{ background: "#f8f9fa", padding: "0.75rem", borderRadius: 6, gridColumn: "1 / -1" }}>
                      <span style={{ fontSize: "0.8rem", color: "#666" }}>Skillset</span>
                      <p style={{ margin: "0.25rem 0 0", fontWeight: 500 }}>{selectedEmployee.skillset || "N/A"}</p>
                    </div>
                  </div>

                  <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: "0.5rem" }}>Appraisal History</h3>
                  {selectedEmployee.appraisal_history.length === 0 ? (
                    <p style={{ color: "#666", fontSize: "0.9rem" }}>No appraisal cycles found for this employee.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      {selectedEmployee.appraisal_history.map((h) => (
                        <div key={h.participant_id} style={{ border: "1px solid #eee", borderRadius: 6, padding: "0.75rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "0.9rem" }}>{h.cycle_name}</strong>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.15rem 0.5rem",
                                borderRadius: 8,
                                background: h.participant_status === "completed" ? "#d4edda" : "#fff3cd",
                                color: h.participant_status === "completed" ? "#155724" : "#856404",
                              }}
                            >
                              {statusLabels[h.participant_status] || h.participant_status}
                            </span>
                          </div>
                          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#666" }}>
                            {h.period_from} to {h.period_to}
                            {h.meeting_time && ` • Meeting: ${new Date(h.meeting_time).toLocaleString()}`}
                          </p>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.1rem 0.4rem",
                              borderRadius: 4,
                              background: h.cycle_status === "completed" ? "#cce5ff" : h.cycle_status === "active" ? "#d4edda" : "#fff3cd",
                              color: h.cycle_status === "completed" ? "#004085" : h.cycle_status === "active" ? "#155724" : "#856404",
                              marginTop: "0.25rem",
                              display: "inline-block",
                            }}
                          >
                            Cycle: {h.cycle_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid #eee", marginTop: "1.5rem", paddingTop: "1rem" }}>
                    {confirmRemove === selectedEmployee.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ color: "#dc3545", fontSize: "0.9rem", fontWeight: 500 }}>
                          Are you sure? This cannot be undone.
                        </span>
                        <button
                          onClick={() => handleRemoveEmployee(selectedEmployee.id)}
                          style={{ padding: "0.4rem 1rem", background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          Confirm Remove
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          style={{ padding: "0.4rem 1rem", background: "#6c757d", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(selectedEmployee.id)}
                        style={{ padding: "0.4rem 1rem", background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Remove Employee
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === "cycles" && (
          <div style={{ display: "flex", gap: "2rem" }}>
            <div style={{ width: 320, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0 }}>Cycles</h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  style={{ padding: "0.35rem 0.75rem", background: "#007bff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}
                >
                  + New Cycle
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={handleCreateCycle} style={{ background: "#fff", padding: "1rem", borderRadius: 6, marginBottom: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <h4 style={{ margin: "0 0 0.75rem" }}>Create Appraisal Cycle</h4>
                  <input
                    type="text"
                    placeholder="Cycle name (e.g. Q1 2026)"
                    value={newCycle.name}
                    onChange={(e) => setNewCycle((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    style={{ width: "100%", padding: "0.4rem", marginBottom: "0.5rem", border: "1px solid #ccc", borderRadius: 3 }}
                  />
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>Period from</label>
                  <input
                    type="date"
                    value={newCycle.period_from}
                    onChange={(e) => setNewCycle((prev) => ({ ...prev, period_from: e.target.value }))}
                    required
                    style={{ width: "100%", padding: "0.4rem", marginBottom: "0.5rem", border: "1px solid #ccc", borderRadius: 3 }}
                  />
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>Period to</label>
                  <input
                    type="date"
                    value={newCycle.period_to}
                    onChange={(e) => setNewCycle((prev) => ({ ...prev, period_to: e.target.value }))}
                    required
                    style={{ width: "100%", padding: "0.4rem", marginBottom: "0.75rem", border: "1px solid #ccc", borderRadius: 3 }}
                  />
                  <button type="submit" style={{ padding: "0.4rem 1rem", background: "#28a745", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}>
                    Create & Add Employees
                  </button>
                </form>
              )}

              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  onClick={() => handleSelectCycle(cycle)}
                  style={{
                    background: selectedCycle?.id === cycle.id ? "#e3f2fd" : "#fff",
                    padding: "0.75rem",
                    borderRadius: 6,
                    marginBottom: "0.5rem",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    border: selectedCycle?.id === cycle.id ? "1px solid #90caf9" : "1px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "0.9rem" }}>{cycle.name}</strong>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: 8,
                        background: cycle.status === "active" ? "#d4edda" : cycle.status === "completed" ? "#cce5ff" : "#fff3cd",
                        color: cycle.status === "active" ? "#155724" : cycle.status === "completed" ? "#004085" : "#856404",
                      }}
                    >
                      {cycle.status}
                    </span>
                  </div>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#666" }}>
                    {cycle.period_from} to {cycle.period_to}
                  </p>
                  {cycle.status === "draft" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartCycle(cycle.id); }}
                      style={{ marginTop: "0.5rem", padding: "0.25rem 0.5rem", background: "#17a2b8", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Start Cycle
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ flex: 1 }}>
              {selectedCycle ? (
                <>
                  <h2 style={{ marginBottom: "0.25rem" }}>{selectedCycle.name}</h2>
                  <p style={{ color: "#666", marginBottom: "1rem", fontSize: "0.9rem" }}>
                    {selectedCycle.status === "draft"
                      ? "Add employees to this cycle, then start it to begin appraisals."
                      : `${participants.length} participant(s) in this cycle`}
                  </p>

                  {selectedCycle.status === "draft" && (
                    <div style={{ background: "#fff", padding: "1.25rem", borderRadius: 6, marginBottom: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                      <h4 style={{ margin: "0 0 0.75rem" }}>Add Employees to Cycle</h4>
                      {companyEmployees.length === 0 ? (
                        <p style={{ color: "#666", fontSize: "0.9rem" }}>
                          No employees in the company yet.{" "}
                          <button
                            type="button"
                            onClick={() => setActiveTab("employees")}
                            style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                          >
                            Add employees first
                          </button>
                        </p>
                      ) : availableForCycle.length === 0 ? (
                        <p style={{ color: "#666", fontSize: "0.9rem" }}>All employees have been added to this cycle.</p>
                      ) : (
                        <>
                          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem", maxHeight: 220, overflowY: "auto" }}>
                            {availableForCycle.map((emp) => (
                              <label
                                key={emp.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  padding: "0.5rem",
                                  border: "1px solid #eee",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  background: selectedEmployeeIds.includes(emp.id) ? "#e3f2fd" : "transparent",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedEmployeeIds.includes(emp.id)}
                                  onChange={() => toggleEmployeeSelection(emp.id)}
                                />
                                <span>
                                  <strong>{emp.full_name || emp.username}</strong> ({emp.employee_id}) - {emp.designation}
                                </span>
                              </label>
                            ))}
                          </div>
                          <button
                            onClick={handleAddParticipants}
                            disabled={selectedEmployeeIds.length === 0}
                            style={{ padding: "0.4rem 1rem", background: selectedEmployeeIds.length === 0 ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: 4, cursor: selectedEmployeeIds.length === 0 ? "not-allowed" : "pointer" }}
                          >
                            Add {selectedEmployeeIds.length > 0 ? `${selectedEmployeeIds.length} ` : ""}to Cycle
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {participants.length === 0 ? (
                    <p style={{ color: "#666" }}>No participants in this cycle yet.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          style={{ background: "#fff", padding: "1rem", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong>{p.employee_name}</strong> ({p.employee_code})
                              <br />
                              <span style={{ fontSize: "0.85rem", color: "#666" }}>{p.designation}</span>
                              {p.lead_name && (
                                <span style={{ fontSize: "0.85rem", color: "#666" }}> | Lead: {p.lead_name}</span>
                              )}
                            </div>
                            <span
                              style={{
                                padding: "0.2rem 0.6rem",
                                borderRadius: 10,
                                fontSize: "0.75rem",
                                background: p.status === "completed" ? "#d4edda" : "#fff3cd",
                                color: p.status === "completed" ? "#155724" : "#856404",
                              }}
                            >
                              {statusLabels[p.status] || p.status}
                            </span>
                          </div>
                          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {p.status === "self_appraisal_submitted" && (
                              <button
                                onClick={() => handleProceed(p.id)}
                                style={{ padding: "0.3rem 0.75rem", background: "#28a745", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: "0.8rem" }}
                              >
                                Proceed to Lead Review
                              </button>
                            )}
                            {p.status === "lead_reviewed" && (
                              <button
                                onClick={() => setMeetingModal({ participantId: p.id, open: true })}
                                style={{ padding: "0.3rem 0.75rem", background: "#6f42c1", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: "0.8rem" }}
                              >
                                Schedule Meeting
                              </button>
                            )}
                            {p.status === "completed" && (
                              <button
                                onClick={() => handleViewForm(p.id)}
                                style={{ padding: "0.3rem 0.75rem", background: "#17a2b8", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: "0.8rem" }}
                              >
                                View Full Form
                              </button>
                            )}
                            {p.meeting_time && (
                              <span style={{ fontSize: "0.8rem", color: "#333" }}>
                                Meeting: {new Date(p.meeting_time).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
                  <h3>Manage Appraisal Cycles</h3>
                  <p>Create a new cycle, add employees for their appraisal, then start the cycle.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Filled Form Modal */}
        {(viewFormData || loadingForm) && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setViewFormData(null); }}
          >
            <div style={{ background: "#fff", borderRadius: 10, width: 750, maxHeight: "85vh", overflow: "auto", padding: "2rem" }}>
              {loadingForm ? (
                <p style={{ textAlign: "center", padding: "2rem" }}>Loading form...</p>
              ) : viewFormData ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                    <div>
                      <h2 style={{ margin: 0 }}>Appraisal Form</h2>
                      <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
                        {viewFormData.employee_name} ({viewFormData.employee_code}) &middot; {viewFormData.cycle_name}
                      </p>
                    </div>
                    <button onClick={() => setViewFormData(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" }}>&times;</button>
                  </div>

                  {viewFormData.self_appraisal && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h3 style={{ borderBottom: "2px solid #007bff", paddingBottom: "0.5rem" }}>Section 1: Self Appraisal</h3>
                      {Object.entries(viewFormData.self_appraisal).filter(([k]) => k !== "submitted_at").map(([key, value]) => (
                        <div key={key} style={{ marginBottom: "0.75rem" }}>
                          <label style={{ display: "block", fontSize: "0.8rem", color: "#666", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</label>
                          <p style={{ margin: "0.25rem 0 0", background: "#f8f9fa", padding: "0.5rem", borderRadius: 4, whiteSpace: "pre-wrap" }}>{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewFormData.performance_ratings && viewFormData.performance_ratings.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h3 style={{ borderBottom: "2px solid #28a745", paddingBottom: "0.5rem" }}>Section 2: Performance Ratings</h3>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#f8f9fa" }}>
                            <th style={{ padding: "0.5rem", textAlign: "left", border: "1px solid #dee2e6" }}>Category</th>
                            <th style={{ padding: "0.5rem", textAlign: "left", border: "1px solid #dee2e6" }}>Item</th>
                            <th style={{ padding: "0.5rem", textAlign: "center", border: "1px solid #dee2e6" }}>Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewFormData.performance_ratings.map((r, i) => (
                            <tr key={i}>
                              <td style={{ padding: "0.4rem 0.5rem", border: "1px solid #dee2e6", textTransform: "capitalize" }}>{r.category}</td>
                              <td style={{ padding: "0.4rem 0.5rem", border: "1px solid #dee2e6" }}>{r.item}</td>
                              <td style={{ padding: "0.4rem 0.5rem", border: "1px solid #dee2e6", textAlign: "center", fontWeight: 600 }}>{r.rating}/10</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {viewFormData.development_plans && viewFormData.development_plans.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h3 style={{ borderBottom: "2px solid #6f42c1", paddingBottom: "0.5rem" }}>Section 3: Individual Development Plan</h3>
                      {viewFormData.development_plans.map((dp, i) => (
                        <div key={i} style={{ marginBottom: "0.75rem", border: "1px solid #eee", borderRadius: 6, padding: "0.75rem" }}>
                          <strong style={{ textTransform: "capitalize", color: "#6f42c1" }}>{dp.category}</strong>
                          <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}><strong>Objectives:</strong> {dp.individual_objectives}</p>
                          <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}><strong>Plan:</strong> {dp.development_plan}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewFormData.additional_remarks && (
                    <div>
                      <h3 style={{ borderBottom: "2px solid #fd7e14", paddingBottom: "0.5rem" }}>Section 4: Additional Remarks</h3>
                      {viewFormData.additional_remarks.appraisee_remarks && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <label style={{ fontSize: "0.8rem", color: "#666" }}>Appraisee Remarks</label>
                          <p style={{ margin: "0.25rem 0 0", background: "#f8f9fa", padding: "0.5rem", borderRadius: 4 }}>{viewFormData.additional_remarks.appraisee_remarks}</p>
                        </div>
                      )}
                      {viewFormData.additional_remarks.appraiser_remarks && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <label style={{ fontSize: "0.8rem", color: "#666" }}>Appraiser Remarks</label>
                          <p style={{ margin: "0.25rem 0 0", background: "#f8f9fa", padding: "0.5rem", borderRadius: 4 }}>{viewFormData.additional_remarks.appraiser_remarks}</p>
                        </div>
                      )}
                      {viewFormData.additional_remarks.special_mentions && (
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "#666" }}>Special Mentions</label>
                          <p style={{ margin: "0.25rem 0 0", background: "#f8f9fa", padding: "0.5rem", borderRadius: 4 }}>{viewFormData.additional_remarks.special_mentions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}

        {meetingModal.open && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div style={{ background: "#fff", padding: "2rem", borderRadius: 8, width: 400 }}>
              <h3 style={{ marginTop: 0 }}>Schedule Meeting</h3>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
                  Meeting Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4 }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setMeetingModal({ participantId: "", open: false }); setMeetingTime(""); }}
                  style={{ padding: "0.5rem 1rem", background: "#6c757d", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeeting}
                  disabled={!meetingTime}
                  style={{ padding: "0.5rem 1rem", background: "#6f42c1", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default HRDashboard;
