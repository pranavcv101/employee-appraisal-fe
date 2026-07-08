import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          AppraisalHub
        </h1>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link to="/signin" className="btn btn-outline">
            Sign In
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Get Started
          </Link>
        </nav>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 2rem",
        }}
      >
        <div style={{ maxWidth: "700px", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: "1.5rem",
            }}
          >
            Streamline Your Company's Appraisal Process
          </h2>
          <p
            style={{
              fontSize: "1.25rem",
              color: "var(--color-text-muted)",
              marginBottom: "2.5rem",
            }}
          >
            A modern platform for managing employee performance reviews.
            Create your company account, add HRs, and let your team thrive.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}>
              I own a company
            </Link>
            <Link to="/signin" className="btn btn-outline" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}>
              Sign In
            </Link>
          </div>
          <p style={{ marginTop: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            HR or employee?{" "}
            <Link to="/signin" style={{ color: "var(--color-primary)" }}>
              Choose your sign-in type
            </Link>
          </p>
        </div>
      </main>

      <footer
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <p>AppraisalHub - Built for learning backend development</p>
      </footer>
    </div>
  );
}

export default LandingPage;
