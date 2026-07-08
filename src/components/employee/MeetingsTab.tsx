import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMeetings, MeetingItem } from "../../api/employee";
import { createLogger } from "../../utils/logger";

const log = createLogger("meetings-tab");

export default function MeetingsTab() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      const res = await getMeetings();
      setMeetings(res.meetings);
      log.info("Loaded %d meetings", res.meetings.length);
    } catch (err) {
      log.error("Failed to load meetings", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>Scheduled Meetings</h2>
      {meetings.length === 0 ? (
        <p style={{ color: "#666" }}>No scheduled meetings.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {meetings.map((m) => (
            <div
              key={m.id}
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{m.employee_name} ({m.employee_code})</h3>
                  <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                    Cycle: {m.cycle_name}
                  </p>
                  {m.lead_name && (
                    <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                      Lead: {m.lead_name}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#333" }}>
                    {new Date(m.meeting_time).toLocaleString()}
                  </p>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: 12,
                      fontSize: "0.8rem",
                      background: "#fff3cd",
                      color: "#856404",
                    }}
                  >
                    Meeting Scheduled
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/employee/meeting/${m.id}`)}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  background: "#6f42c1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Complete Meeting (IDP + Remarks)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
