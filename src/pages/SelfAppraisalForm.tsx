import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { submitSelfAppraisal, SelfAppraisalPayload } from "../api/employee";
import { createLogger } from "../utils/logger";

const log = createLogger("self-appraisal-form");

export default function SelfAppraisalForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<SelfAppraisalPayload>({
    lead_employee_id: "",
    team_worked_in: "",
    contributions: "",
    challenges: "",
    skills_improved: "",
    feedback_acted_on: "",
    additional_responsibilities: "",
    future_goals: "",
  });

  function handleChange(field: keyof SelfAppraisalPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError("");
    try {
      await submitSelfAppraisal(id, form);
      log.info("Self appraisal submitted for participant %s", id);
      navigate("/employee");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to submit";
      setError(msg);
      log.error("Submit failed: %s", msg);
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof SelfAppraisalPayload; label: string; placeholder: string }[] = [
    {
      key: "lead_employee_id",
      label: "Lead Employee ID",
      placeholder: "e.g. E-001",
    },
    {
      key: "team_worked_in",
      label: "Team/Project Worked In",
      placeholder: "Name of the team or project you primarily worked in",
    },
    {
      key: "contributions",
      label: "Key Contributions",
      placeholder: "Describe your key contributions during this appraisal period",
    },
    {
      key: "challenges",
      label: "Challenges Faced",
      placeholder: "Describe the challenges you faced and how you overcame them",
    },
    {
      key: "skills_improved",
      label: "Skills Improved",
      placeholder: "List skills you improved or acquired during this period",
    },
    {
      key: "feedback_acted_on",
      label: "Feedback Acted On",
      placeholder: "Describe feedback you received and how you acted on it",
    },
    {
      key: "additional_responsibilities",
      label: "Additional Responsibilities",
      placeholder: "Any additional responsibilities you took on beyond your role",
    },
    {
      key: "future_goals",
      label: "Future Goals",
      placeholder: "What are your goals for the next appraisal period?",
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <button
        onClick={() => navigate("/employee")}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          background: "none",
          border: "1px solid #ccc",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        &larr; Back to Portal
      </button>
      <h2>Self Appraisal Form</h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Fill in all sections below. Once submitted, it cannot be edited.
      </p>

      {error && (
        <div style={{ background: "#f8d7da", color: "#721c24", padding: "0.75rem", borderRadius: 4, marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {fields.map((f) => (
          <div key={f.key} style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}>
              {f.label}
            </label>
            {f.key === "lead_employee_id" || f.key === "team_worked_in" ? (
              <input
                type="text"
                value={form[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  fontSize: "0.95rem",
                }}
              />
            ) : (
              <textarea
                value={form[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                required
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  fontSize: "0.95rem",
                  resize: "vertical",
                }}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 2rem",
            background: loading ? "#999" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          {loading ? "Submitting..." : "Submit Self Appraisal"}
        </button>
      </form>
    </div>
  );
}
