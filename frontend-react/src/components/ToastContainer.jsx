import { useNotification } from "../context/NotificationContext";
import { useEffect, useRef } from "react";

const ICONS = {
  success: "✅",
  error:   "🚨",
  warning: "⚠️",
  info:    "ℹ️",
};

const COLORS = {
  success: { bg: "#0d2b1f", border: "#22c55e", text: "#4ade80", bar: "#22c55e" },
  error:   { bg: "#2b0d0d", border: "#ef4444", text: "#f87171", bar: "#ef4444" },
  warning: { bg: "#2b1f0d", border: "#f59e0b", text: "#fbbf24", bar: "#f59e0b" },
  info:    { bg: "#0d1f2b", border: "#3b82f6", text: "#60a5fa", bar: "#3b82f6" },
};

function Toast({ toast, onRemove }) {
  const c = COLORS[toast.type] || COLORS.info;
  const progressRef = useRef(null);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    el.style.width = "100%";
    const anim = el.animate([{ width: "100%" }, { width: "0%" }], {
      duration: toast.duration,
      easing: "linear",
      fill: "forwards",
    });
    return () => anim.cancel();
  }, [toast.duration]);

  return (
    <div
      style={{
        position: "relative",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "10px",
        padding: "12px 44px 12px 14px",
        minWidth: "300px",
        maxWidth: "420px",
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}22`,
        animation: "toastSlideIn 0.3s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>{ICONS[toast.type]}</span>
        <span style={{ fontSize: "13px", lineHeight: "1.5", color: c.text, fontWeight: "500" }}>
          {toast.message}
        </span>
      </div>
      {/* Progress bar */}
      <div
        ref={progressRef}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          background: c.bar,
          borderRadius: "0 0 0 10px",
          opacity: 0.7,
        }}
      />
      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          position: "absolute",
          top: "8px",
          right: "10px",
          background: "none",
          border: "none",
          color: c.text,
          fontSize: "16px",
          cursor: "pointer",
          opacity: 0.7,
          lineHeight: 1,
          padding: "2px 4px",
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "72px",
          right: "20px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <Toast toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
}
