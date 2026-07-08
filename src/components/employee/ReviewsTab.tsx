import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReviews, ReviewItem } from "../../api/employee";
import { createLogger } from "../../utils/logger";

const log = createLogger("reviews-tab");

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const res = await getReviews();
      setReviews(res.reviews);
      log.info("Loaded %d reviews", res.reviews.length);
    } catch (err) {
      log.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>Reviews (as Lead)</h2>
      {reviews.length === 0 ? (
        <p style={{ color: "#666" }}>No pending reviews assigned to you as a lead.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{r.employee_name} ({r.employee_code})</h3>
                  <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                    Cycle: {r.cycle_name}
                  </p>
                </div>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: 12,
                    fontSize: "0.8rem",
                    background: "#e3f2fd",
                    color: "#1565c0",
                  }}
                >
                  {r.status === "lead_reviewing" ? "Pending Review" : r.status}
                </span>
              </div>
              {r.status === "lead_reviewing" && (
                <button
                  onClick={() => navigate(`/employee/review/${r.id}`)}
                  style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    background: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Submit Performance Rating
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
