import { useState, FormEvent } from "react";
import { useNavigate, Link, useParams, Navigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import {
  isValidPortal,
  PORTAL_CONFIG,
  roleMatchesPortal,
  type LoginPortal,
} from "../utils/authRouting";

function SignIn() {
  const { portal: portalParam } = useParams<{ portal: string }>();
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  if (!isValidPortal(portalParam)) {
    return <Navigate to="/signin" replace />;
  }

  const portal: LoginPortal = portalParam;
  const config = PORTAL_CONFIG[portal];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(companyName, username, password);

      if (!roleMatchesPortal(data.role, portal)) {
        const portalLabel =
          portal === "admin" ? "company owner" : portal === "hr" ? "HR" : "employee";
        setError(
          `This account is not registered as ${portalLabel}. Please choose the correct sign-in option.`
        );
        return;
      }

      loginUser(data.access_token, {
        id: data.user_id,
        username: data.username,
        role: data.role,
        company_name: data.company_name,
      });

      navigate(config.dashboard);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Login failed");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "450px" }}>
        <Link
          to="/signin"
          style={{
            display: "inline-block",
            marginBottom: "1rem",
            color: "var(--color-text-muted)",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          &larr; Change sign-in type
        </Link>

        <h2 style={{ marginBottom: "0.5rem", fontSize: "1.75rem" }}>{config.title}</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
          {config.subtitle}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">
              {portal === "employee" ? "Username or Employee ID" : "Username"}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                portal === "employee"
                  ? "Enter your username or employee id"
                  : "Your username"
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {portal === "admin" && (
          <p
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            Don't have a company account?{" "}
            <Link to="/signup" style={{ color: "var(--color-primary)" }}>
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default SignIn;
