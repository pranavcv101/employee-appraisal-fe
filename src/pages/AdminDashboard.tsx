import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { addHR, AddHRResponse } from "../api/auth";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [hrUsername, setHrUsername] = useState("");
  const [result, setResult] = useState<AddHRResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddHR = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await addHR(hrUsername);
      setResult(data);
      setHrUsername("");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Failed to add HR");
      } else {
        setError("Failed to add HR. Please try again.");
      }
    } finally {
      setLoading(false);
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
        <div className="card" style={{ maxWidth: "500px" }}>
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
      </main>
    </div>
  );
}

export default AdminDashboard;
