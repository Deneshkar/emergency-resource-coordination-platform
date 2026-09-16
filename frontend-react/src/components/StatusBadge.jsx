const statusConfig = {
  // Incident statuses
  Reported: { color: "var(--amber)", bg: "var(--amber-glow)", dot: true },
  Investigating: { color: "var(--blue)", bg: "var(--blue-glow)", dot: true },
  Resolved: { color: "var(--green)", bg: "var(--green-glow)" },
  Closed: { color: "var(--text-dim)", bg: "rgba(71,85,105,0.15)" },

  // Dispatch statuses
  Proposed: { color: "var(--text-muted)", bg: "rgba(100,116,139,0.15)" },
  PendingApproval: { color: "var(--amber)", bg: "var(--amber-glow)", dot: true },
  Approved: { color: "var(--green)", bg: "var(--green-glow)" },
  Assigned: { color: "var(--blue)", bg: "var(--blue-glow)" },
  InProgress: { color: "var(--cyan)", bg: "var(--cyan-glow)", dot: true },
  Completed: { color: "var(--green)", bg: "var(--green-glow)" },
  Rejected: { color: "var(--red)", bg: "var(--red-glow)" },

  // Priority
  Low: { color: "var(--text-muted)", bg: "rgba(100,116,139,0.15)" },
  Medium: { color: "var(--amber)", bg: "var(--amber-glow)" },
  High: { color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  Critical: { color: "var(--red)", bg: "var(--red-glow)", dot: true, pulse: true },

  // Resource statuses
  Available: { color: "var(--green)", bg: "var(--green-glow)" },
  Dispatched: { color: "var(--amber)", bg: "var(--amber-glow)", dot: true },
  Maintenance: { color: "var(--text-muted)", bg: "rgba(100,116,139,0.15)" },
  Reserved: { color: "var(--purple)", bg: "var(--purple-glow)" },

  // Shelter statuses
  Active: { color: "var(--green)", bg: "var(--green-glow)", dot: true },
  Full: { color: "var(--red)", bg: "var(--red-glow)", dot: true },
  Inactive: { color: "var(--text-dim)", bg: "rgba(71,85,105,0.15)" },

  // Inventory
  InStock: { color: "var(--green)", bg: "var(--green-glow)" },
  LowStock: { color: "var(--amber)", bg: "var(--amber-glow)", dot: true },
  OutOfStock: { color: "var(--red)", bg: "var(--red-glow)", dot: true, pulse: true },

  // Shift (Active/Rejected reuse the identical shelter/dispatch entries above)
  Scheduled: { color: "var(--blue)", bg: "var(--blue-glow)" },
  Cancelled: { color: "var(--red)", bg: "var(--red-glow)" },

  // Dispatch task
  Accepted: { color: "var(--green)", bg: "var(--green-glow)" },
  OnTheWay: { color: "var(--cyan)", bg: "var(--cyan-glow)", dot: true },
  Arrived: { color: "var(--blue)", bg: "var(--blue-glow)" },
};

const fallback = { color: "var(--text-muted)", bg: "rgba(100,116,139,0.15)" };

export default function StatusBadge({ status, size = "sm" }) {
  const config = statusConfig[status] || fallback;

  const sizeStyles = {
    sm: { padding: "3px 10px", fontSize: "11px" },
    md: { padding: "5px 14px", fontSize: "12px" },
    lg: { padding: "7px 18px", fontSize: "13px" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontWeight: "700",
        borderRadius: "20px",
        color: config.color,
        background: config.bg,
        whiteSpace: "nowrap",
        letterSpacing: "0.3px",
        ...sizeStyles[size],
      }}
    >
      {config.dot && (
        <span
          className={config.pulse ? "glow-pulse" : ""}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: config.color,
            boxShadow: `0 0 6px ${config.color}`,
            flexShrink: 0,
          }}
        />
      )}
      {status}
    </span>
  );
}
