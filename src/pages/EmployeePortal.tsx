import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createLogger } from "../utils/logger";
import DashboardTab from "../components/employee/DashboardTab";
import SelfAppraisalTab from "../components/employee/SelfAppraisalTab";
import ReviewsTab from "../components/employee/ReviewsTab";
import MeetingsTab from "../components/employee/MeetingsTab";

const log = createLogger("employee-portal");

type Tab = "dashboard" | "self-appraisal" | "reviews" | "meetings";

export default function EmployeePortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  log.info("Employee portal loaded");

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "My Dashboard" },
    { key: "self-appraisal", label: "Self Appraisal" },
    { key: "reviews", label: "Reviews" },
    { key: "meetings", label: "Meetings" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 240,
          backgroundColor: "#1a1a2e",
          color: "#fff",
          padding: "2rem 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ padding: "0 1.5rem", marginBottom: "0.5rem", fontSize: "1.1rem" }}>
          Employee Portal
        </h2>
        <p style={{ padding: "0 1.5rem", fontSize: "0.85rem", color: "#aaa", marginBottom: "2rem" }}>
          {user?.username}
        </p>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem 1.5rem",
                border: "none",
                background: activeTab === tab.key ? "#16213e" : "transparent",
                color: activeTab === tab.key ? "#4fc3f7" : "#ccc",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.95rem",
                borderLeft: activeTab === tab.key ? "3px solid #4fc3f7" : "3px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "1rem 1.5rem" }}>
          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "2rem", backgroundColor: "#f5f5f5" }}>
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "self-appraisal" && <SelfAppraisalTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "meetings" && <MeetingsTab />}
      </main>
    </div>
  );
}
