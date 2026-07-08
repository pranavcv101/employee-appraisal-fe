import { useAuth } from "../context/AuthContext";

function HRDashboard() {
  const { user, logout } = useAuth();

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
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>HR Dashboard</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {user?.company_name} - {user?.username}
          </p>
        </div>
        <button className="btn btn-outline" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="container" style={{ padding: "2rem" }}>
        <div className="card">
          <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
            Welcome, {user?.username}
          </h3>
          <p style={{ color: "var(--color-text-muted)" }}>
            Your HR dashboard is ready. More features will be added here as the system grows
            (employee management, appraisal reviews, etc.).
          </p>
        </div>
      </main>
    </div>
  );
}

export default HRDashboard;
