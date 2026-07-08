import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyAppraisals, MyAppraisal } from "../../api/employee";
import { createLogger } from "../../utils/logger";

const log = createLogger("self-appraisal-tab");

export default function SelfAppraisalTab() {
  const [appraisals, setAppraisals] = useState<MyAppraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAppraisals();
  }, []);

  async function loadAppraisals() {
    try {
      const res = await getMyAppraisals();
      setAppraisals(res.appraisals);
      log.info("Loaded %d appraisals", res.appraisals.length);
    } catch (err) {
      log.error("Failed to load appraisals", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  const statusLabels: Record<string, string> = {
    pending_self_appraisal: "Pending Self Appraisal",
    self_appraisal_submitted: "Self Appraisal Submitted",
    hr_reviewed: "HR Reviewed",
    lead_reviewing: "Lead Reviewing",
    lead_reviewed: "Lead Reviewed",
    meeting_scheduled: "Meeting Scheduled",
    completed: "Completed",
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>My Appraisals</h2>
      {appraisals.length === 0 ? (
        <p style={{ color: "#666" }}>No active appraisals assigned to you.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {appraisals.map((a) => (
            <div
              key={a.id}
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{a.cycle_name}</h3>
                  <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                    {a.period_from} to {a.period_to}
                  </p>
                </div>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: 12,
                    fontSize: "0.8rem",
                    background: a.status === "completed" ? "#d4edda" : "#fff3cd",
                    color: a.status === "completed" ? "#155724" : "#856404",
                  }}
                >
                  {statusLabels[a.status] || a.status}
                </span>
              </div>
              {a.status === "pending_self_appraisal" && (
                <button
                  onClick={() => navigate(`/employee/appraisal/${a.id}`)}
                  style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    background: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Fill Self Appraisal
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
