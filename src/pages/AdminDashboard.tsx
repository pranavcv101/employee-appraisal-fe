import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { addHR, listHRs, removeHR, AddHRResponse, HRItem } from "../api/auth";
import { createLogger } from "../utils/logger";

const log = createLogger("AdminDashboard");

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

  useEffect(() => {
    fetchHRs();
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

      <main className="container" style={{ padding: "2rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
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
      </main>
    </div>
  );
}

export default AdminDashboard;
