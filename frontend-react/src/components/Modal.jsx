import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, subtitle, children, width = "520px" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop anim-fade-in"
      onClick={onClose}
    >
      <div
        className="modal-content anim-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: width }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && (
              <p className="modal-subtitle">{subtitle}</p>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: ${width};
          max-height: 85vh;
          overflow: auto;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .modal-title {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .modal-subtitle {
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .modal-close {
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .modal-close:hover {
          background: var(--bg-active);
          color: var(--text-primary);
        }
        .modal-body {
          padding: 20px 24px;
        }
      `}</style>
    </div>
  );
}

/* Reusable form field wrapper */
export function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.78rem",
          fontWeight: "600",
          color: "var(--text-muted)",
          marginBottom: "6px",
        }}
      >
        {label} {required && <span style={{ color: "var(--red)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* Form row for side-by-side fields (stacks on mobile) */
export function FormRow({ children }) {
  return (
    <div className="form-row-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      {children}
    </div>
  );
}
