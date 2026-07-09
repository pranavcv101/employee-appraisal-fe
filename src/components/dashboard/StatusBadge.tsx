const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending_self_appraisal: { bg: "#fff3cd", color: "#856404", label: "Pending Self Appraisal" },
  self_appraisal_submitted: { bg: "#d1ecf1", color: "#0c5460", label: "Self Appraisal Submitted" },
  lead_reviewing: { bg: "#e3f2fd", color: "#1565c0", label: "Lead Reviewing" },
  lead_reviewed: { bg: "#e8f5e9", color: "#2e7d32", label: "Lead Reviewed" },
  meeting_scheduled: { bg: "#f3e5f5", color: "#6a1b9a", label: "Meeting Scheduled" },
  completed: { bg: "#d4edda", color: "#155724", label: "Completed" },
  draft: { bg: "#e2e8f0", color: "#475569", label: "Draft" },
  active: { bg: "#dbeafe", color: "#1e40af", label: "Active" },
};

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { bg: "#e2e8f0", color: "#475569", label: status };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.2rem 0.6rem",
        borderRadius: "12px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}

export default StatusBadge;
