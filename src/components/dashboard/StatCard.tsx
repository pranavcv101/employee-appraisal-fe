interface StatCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  color?: string;
}

function StatCard({ label, value, subtitle, color = "var(--color-primary)" }: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        minWidth: "180px",
        flex: "1",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: color,
        }}
      />
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--color-text-muted)",
          marginBottom: "0.25rem",
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "var(--color-text)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            marginTop: "0.25rem",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default StatCard;
