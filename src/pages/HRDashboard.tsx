import { useState, useEffect } from "react";
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
  Cycle,
  Participant,
  EmployeeItem,
  AddEmployeeResponse,
} from "../api/cycles";
import { createLogger } from "../utils/logger";

const log = createLogger("hr-dashboard");

type Tab = "cycles" | "employees";

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
  const [activeTab, setActiveTab] = useState<Tab>("cycles");
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

  useEffect(() => {
    loadCycles();
    loadEmployees();
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
          borderBottom: "1px solid #ddd",
          background: "#fff",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>HR Dashboard</h1>
          <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
            {user?.company_name} - {user?.username}
          </p>
        </div>
        <button
          onClick={logout}
          style={{ padding: "0.5rem 1rem", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          Logout
        </button>
      </header>

      <nav
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid #ddd",
          background: "#fff",
          padding: "0 2rem",
        }}
      >
        {(["cycles", "employees"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              background: "none",
              borderBottom: activeTab === tab ? "2px solid #007bff" : "2px solid transparent",
              color: activeTab === tab ? "#007bff" : "#666",
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab === "cycles" ? "Appraisal Cycles" : "Employees"}
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
                    style={{ background: "#fff", padding: "1rem", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between" }}
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
