import { Link } from "react-router-dom";

const portals = [
  {
    key: "admin",
    title: "I own a company",
    description: "Create and manage your company account, HR team, and employees.",
    path: "/signin/admin",
    accent: "#2563eb",
  },
  {
    key: "hr",
    title: "I'm HR",
    description: "Manage appraisal cycles, review submissions, and schedule meetings.",
    path: "/signin/hr",
    accent: "#059669",
  },
  {
    key: "employee",
    title: "I'm an Employee",
    description: "Complete self-appraisals, lead reviews, and attend IDP meetings.",
    path: "/signin/employee",
    accent: "#7c3aed",
  },
] as const;

function SignInSelect() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--color-bg, #f8fafc)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link
            to="/"
            style={{
              display: "inline-block",
              marginBottom: "1rem",
              color: "var(--color-text-muted)",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            &larr; Back to home
          </Link>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Sign In
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1.05rem" }}>
            Choose how you use AppraisalHub
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {portals.map((portal) => (
            <Link
              key={portal.key}
              to={portal.path}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                className="card"
                style={{
                  height: "100%",
                  padding: "1.5rem",
                  borderTop: `4px solid ${portal.accent}`,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  cursor: "pointer",
                }}
              >
                <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
                  {portal.title}
                </h2>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    marginBottom: "1.25rem",
                  }}
                >
                  {portal.description}
                </p>
                <span
                  style={{
                    color: portal.accent,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Continue &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p
          style={{
            marginTop: "2rem",
            textAlign: "center",
            color: "var(--color-text-muted)",
          }}
        >
          New company?{" "}
          <Link to="/signup" style={{ color: "var(--color-primary)" }}>
            Create a company account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignInSelect;
