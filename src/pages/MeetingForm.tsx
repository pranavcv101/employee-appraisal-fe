import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { completeMeeting, MeetingCompletePayload, getAppraisalDetails } from "../api/employee";
import { createLogger } from "../utils/logger";

const log = createLogger("meeting-form");

const IDP_CATEGORIES = ["technical", "behavioral", "functional"];

interface IDPEntry {
  category: string;
  individual_objectives: string;
  development_plan: string;
}

export default function MeetingForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  const [plans, setPlans] = useState<IDPEntry[]>(
    IDP_CATEGORIES.map((cat) => ({
      category: cat,
      individual_objectives: "",
      development_plan: "",
    }))
  );

  const [remarks, setRemarks] = useState({
    appraisee_remarks: "",
    appraiser_remarks: "",
    special_mentions: "",
  });

  useEffect(() => {
    if (id) {
      getAppraisalDetails(id).then((details) => {
        setEmployeeName(`${details.employee_name} (${details.employee_code})`);
      }).catch(() => {});
    }
  }, [id]);

  function updatePlan(index: number, field: keyof IDPEntry, value: string) {
    setPlans((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError("");

    const payload: MeetingCompletePayload = {
      development_plans: plans,
      additional_remarks: remarks,
    };

    try {
      await completeMeeting(id, payload);
      log.info("Meeting completed for participant %s", id);
      navigate("/employee");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to complete meeting";
      setError(msg);
      log.error("Complete meeting failed: %s", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
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
      <h2>IDP Meeting Form</h2>
      {employeeName && <p style={{ color: "#666" }}>Employee: {employeeName}</p>}
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Complete the Individual Development Plan and Additional Remarks during the meeting.
      </p>

      {error && (
        <div style={{ background: "#f8d7da", color: "#721c24", padding: "0.75rem", borderRadius: 4, marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h3 style={{ borderBottom: "2px solid #6f42c1", paddingBottom: "0.5rem" }}>
          Section 3: Individual Development Plan
        </h3>

        {plans.map((plan, index) => (
          <div
            key={plan.category}
            style={{
              background: "#fff",
              borderRadius: 6,
              padding: "1.25rem",
              marginBottom: "1rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <h4 style={{ margin: "0 0 0.75rem 0", textTransform: "capitalize", color: "#6f42c1" }}>
              {plan.category}
            </h4>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                Individual Objectives
              </label>
              <textarea
                value={plan.individual_objectives}
                onChange={(e) => updatePlan(index, "individual_objectives", e.target.value)}
                required
                rows={3}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4, resize: "vertical" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                Development Plan
              </label>
              <textarea
                value={plan.development_plan}
                onChange={(e) => updatePlan(index, "development_plan", e.target.value)}
                required
                rows={3}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4, resize: "vertical" }}
              />
            </div>
          </div>
        ))}

        <h3 style={{ borderBottom: "2px solid #6f42c1", paddingBottom: "0.5rem", marginTop: "2rem" }}>
          Section 4: Additional Remarks
        </h3>

        <div style={{ background: "#fff", borderRadius: 6, padding: "1.25rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem" }}>
              Appraisee Remarks
            </label>
            <textarea
              value={remarks.appraisee_remarks}
              onChange={(e) => setRemarks((prev) => ({ ...prev, appraisee_remarks: e.target.value }))}
              rows={3}
              placeholder="Any remarks from the appraisee..."
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4, resize: "vertical" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem" }}>
              Appraiser Remarks
            </label>
            <textarea
              value={remarks.appraiser_remarks}
              onChange={(e) => setRemarks((prev) => ({ ...prev, appraiser_remarks: e.target.value }))}
              rows={3}
              placeholder="Any remarks from the appraiser/lead..."
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4, resize: "vertical" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem" }}>
              Special Mentions
            </label>
            <textarea
              value={remarks.special_mentions}
              onChange={(e) => setRemarks((prev) => ({ ...prev, special_mentions: e.target.value }))}
              rows={3}
              placeholder="Any special mentions or achievements worth noting..."
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4, resize: "vertical" }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 2rem",
            background: loading ? "#999" : "#6f42c1",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
            marginBottom: "2rem",
          }}
        >
          {loading ? "Submitting..." : "Complete Meeting"}
        </button>
      </form>
    </div>
  );
}
