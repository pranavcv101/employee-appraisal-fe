import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { submitPerformanceRating, RatingItemPayload, getAppraisalDetails } from "../api/employee";
import { createLogger } from "../utils/logger";

const log = createLogger("lead-review-form");

const PERFORMANCE_CATEGORIES: Record<string, string[]> = {
  Technical: [
    "Technical Knowledge",
    "Code Practices",
    "Quality of Deliverables",
    "Problem-Solving",
  ],
  Functional: [
    "Feature Understanding",
    "Big Picture and Connected Impact",
    "Attention to Detail",
    "End-User Perspective",
  ],
  "AI Adoption and Responsible Usage": [
    "Awareness and Responsible Coding with AI Tools",
  ],
  Communication: [
    "Team and Stakeholder Communication",
    "Presenting Ideas and Written/Verbal Skills",
    "Conflict Handling and Professionalism",
  ],
  "Energy and Drive": [
    "Enthusiasm and Initiative",
    "Learning and Adaptability",
  ],
  "Responsibilities and Trust": [
    "Ownership and Commitments",
    "Mistakes and Setback Management",
    "Reliability",
  ],
  Teamwork: [
    "Collaboration and Cross-Functional Work",
    "Mentorship",
  ],
  "Managing Processes and Work": [
    "Multi-tasking and Prioritization",
    "Process Adoption",
    "Balancing Extra Responsibilities",
  ],
  Leadership: [
    "Vision and Direction",
    "Team Development and Guidance",
    "Decision-Making",
    "Accountability",
    "Stakeholder Management",
  ],
};

interface RatingForm {
  [key: string]: {
    rating: number;
    strengths: string;
    improvement_needs: string;
    reason_for_high_rating: string;
  };
}

export default function LeadReviewForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [ratings, setRatings] = useState<RatingForm>({});

  useEffect(() => {
    if (id) {
      getAppraisalDetails(id).then((details) => {
        setEmployeeName(`${details.employee_name} (${details.employee_code})`);
      }).catch(() => {});
    }

    const initial: RatingForm = {};
    Object.entries(PERFORMANCE_CATEGORIES).forEach(([category, items]) => {
      items.forEach((item) => {
        const key = `${category}|${item}`;
        initial[key] = { rating: 5, strengths: "", improvement_needs: "", reason_for_high_rating: "" };
      });
    });
    setRatings(initial);
  }, [id]);

  function updateRating(key: string, field: string, value: string | number) {
    setRatings((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError("");

    const payload: RatingItemPayload[] = Object.entries(ratings).map(([key, val]) => {
      const [category, item] = key.split("|");
      return {
        category,
        item,
        rating: val.rating,
        strengths: val.strengths || undefined,
        improvement_needs: val.improvement_needs || undefined,
        reason_for_high_rating: val.reason_for_high_rating || undefined,
      };
    });

    try {
      await submitPerformanceRating(id, payload);
      log.info("Performance ratings submitted for participant %s", id);
      navigate("/employee");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to submit ratings";
      setError(msg);
      log.error("Submit failed: %s", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: "0 1rem" }}>
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
      <h2>Performance Review</h2>
      {employeeName && <p style={{ color: "#666" }}>Employee: {employeeName}</p>}
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Rate each competency from 1-10. For ratings 8+, provide a reason.
      </p>

      {error && (
        <div style={{ background: "#f8d7da", color: "#721c24", padding: "0.75rem", borderRadius: 4, marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {Object.entries(PERFORMANCE_CATEGORIES).map(([category, items]) => (
          <div key={category} style={{ marginBottom: "2rem" }}>
            <h3 style={{ borderBottom: "2px solid #007bff", paddingBottom: "0.5rem", color: "#333" }}>
              {category}
            </h3>
            {items.map((item) => {
              const key = `${category}|${item}`;
              const val = ratings[key] || { rating: 5, strengths: "", improvement_needs: "", reason_for_high_rating: "" };
              return (
                <div
                  key={key}
                  style={{
                    background: "#fff",
                    borderRadius: 6,
                    padding: "1rem",
                    marginBottom: "0.75rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 500 }}>{item}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={val.rating}
                        onChange={(e) => updateRating(key, "rating", parseInt(e.target.value))}
                        style={{ width: 120 }}
                      />
                      <span style={{ fontWeight: "bold", width: 24, textAlign: "center" }}>{val.rating}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Strengths (optional)"
                      value={val.strengths}
                      onChange={(e) => updateRating(key, "strengths", e.target.value)}
                      style={{ padding: "0.35rem", border: "1px solid #ddd", borderRadius: 3, fontSize: "0.85rem" }}
                    />
                    <input
                      type="text"
                      placeholder="Improvement needs (optional)"
                      value={val.improvement_needs}
                      onChange={(e) => updateRating(key, "improvement_needs", e.target.value)}
                      style={{ padding: "0.35rem", border: "1px solid #ddd", borderRadius: 3, fontSize: "0.85rem" }}
                    />
                  </div>
                  {val.rating >= 8 && (
                    <input
                      type="text"
                      placeholder="Reason for high rating (required for 8+)"
                      value={val.reason_for_high_rating}
                      onChange={(e) => updateRating(key, "reason_for_high_rating", e.target.value)}
                      required
                      style={{
                        marginTop: "0.5rem",
                        width: "100%",
                        padding: "0.35rem",
                        border: "1px solid #ffc107",
                        borderRadius: 3,
                        fontSize: "0.85rem",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 2rem",
            background: loading ? "#999" : "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
            marginBottom: "2rem",
          }}
        >
          {loading ? "Submitting..." : "Submit Performance Ratings"}
        </button>
      </form>
    </div>
  );
}
