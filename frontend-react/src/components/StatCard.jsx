export default function StatCard({ icon, label, value, sub, color = "blue", glow = false }) {
  const colorMap = {
    blue: { text: "var(--blue)", glow: "var(--blue-glow)", bg: "rgba(59,130,246,0.08)" },
    red: { text: "var(--red)", glow: "var(--red-glow)", bg: "rgba(239,68,68,0.08)" },
    amber: { text: "var(--amber)", glow: "var(--amber-glow)", bg: "rgba(245,158,11,0.08)" },
    green: { text: "var(--green)", glow: "var(--green-glow)", bg: "rgba(16,185,129,0.08)" },
    purple: { text: "var(--purple)", glow: "var(--purple-glow)", bg: "rgba(139,92,246,0.08)" },
    cyan: { text: "var(--cyan)", glow: "var(--cyan-glow)", bg: "rgba(6,182,212,0.08)" },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className="card anim-slide-up"
      style={{
        position: "relative",
        overflow: "hidden",
        boxShadow: glow ? `0 0 25px ${c.glow}` : undefined,
      }}
    >
      {/* Accent top line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, ${c.text}, transparent)`,
          opacity: 0.7,
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              color: "var(--text-dim)",
              marginBottom: "8px",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              color: c.text,
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            {value}
          </div>
          {sub && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              {sub}
            </div>
          )}
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-md)",
            background: c.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
