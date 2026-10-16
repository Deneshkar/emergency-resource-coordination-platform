import StatusBadge from "./StatusBadge";

// Student 4 — Validation/Safety Agent result panel.
// Embedded in DispatchList per-dispatch card (coordinator pre-approval gate).
// Props: { result, loading, error, history, onRerun }
export default function ValidationPanel({ result, loading, error, history = [], onRerun }) {
  if (loading) {
    return (
      <div className="glass-card" style={{ marginTop: "12px" }} data-testid="validation-loading">
        <div className="loading-spinner" style={{ padding: "12px" }}>
          <div className="spinner" />
          Running safety checks…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginTop: "12px", borderLeft: "3px solid var(--red)" }} data-testid="validation-error">
        <div className="text-danger" style={{ fontSize: "13px", fontWeight: 600 }}>
          Safety check failed: {error}
        </div>
        {onRerun && (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: "8px" }} onClick={onRerun}>
            Retry safety check
          </button>
        )}
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="glass-card"
        style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)" }}
        data-testid="validation-empty"
      >
        No safety check run yet — run the check before approving this dispatch.
      </div>
    );
  }

  const recColor =
    result.recommendation === "APPROVE"
      ? "var(--green)"
      : result.recommendation === "REVISE"
        ? "var(--amber)"
        : "var(--red)";

  return (
    <div
      className="card"
      style={{ marginTop: "12px", borderLeft: `3px solid ${recColor}` }}
      data-testid={`validation-${result.recommendation}`}
    >
      <div className="card-header" style={{ flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: 700, fontSize: "13px" }}>🛡️ Safety Gate</span>
          <StatusBadge status={result.recommendation} size="md" />
          <span className="badge" data-testid="validation-llm-badge" title="AI-hybrid safety gate: Gemini verdict with deterministic rule fallback">
            🤖 AI Safety Gate
          </span>
          <span className="text-dim" style={{ fontSize: "12px" }}>
            {result.isValid ? "Valid" : "Blocked"} · {result.checks?.length ?? 0} checks
            {typeof result.durationMs === "number" ? ` · ${result.durationMs}ms` : ""}
          </span>
          {(!result.checks || result.checks.length === 0) && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }} data-testid="validation-no-tasks-hint">
              ℹ️ No tasks assigned to this dispatch yet — add a task so volunteers, shifts, shelters and stock can be evaluated.
            </span>
          )}
        </div>
        <div className="text-dim font-mono" style={{ fontSize: "11px" }}>
          {result.validatedAt ? `Checked: ${new Date(result.validatedAt).toLocaleString()}` : ""}
          {result.validatedBy ? ` · by ${result.validatedBy}` : ""}
          {result.auditId ? ` · audit #${result.auditId}` : ""}
        </div>
      </div>

      {result.aiInsight && (
        <div className="glass-card" style={{ marginTop: "10px", padding: "8px 12px", fontSize: "12px", borderLeft: "2px solid var(--blue)" }} data-testid="validation-ai-insight">
          <span style={{ fontWeight: 700 }}>🤖 AI Insight</span>
          <div style={{ marginTop: "2px" }}>{result.aiInsight}</div>
        </div>
      )}

      {result.violations?.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <div className="text-danger" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>
            Blockers ({result.violations.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {result.violations.map((v, i) => (
              <div key={`${v.code}-${i}`} className="glass-card" style={{ padding: "8px 12px", fontSize: "12px", borderLeft: "2px solid var(--red)" }}>
                <span style={{ fontWeight: 700, color: "var(--red)" }}>{v.code}</span>
                <span className="text-dim"> · {v.severity}</span>
                <div style={{ marginTop: "2px" }}>{v.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.warnings?.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px", color: "var(--amber)" }}>
            Warnings ({result.warnings.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {result.warnings.map((w, i) => (
              <div key={`${w.code}-${i}`} className="glass-card" style={{ padding: "8px 12px", fontSize: "12px", borderLeft: "2px solid var(--amber)" }}>
                <span style={{ fontWeight: 700, color: "var(--amber)" }}>{w.code}</span>
                <span className="text-dim"> · {w.severity}</span>
                <div style={{ marginTop: "2px" }}>{w.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.checks?.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <div className="text-dim" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>
            Tool checks ({result.checks.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {result.checks.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", alignItems: "baseline" }}>
                <span aria-hidden="true">{c.passed ? "✅" : "❌"}</span>
                <span className="font-mono text-dim" style={{ whiteSpace: "nowrap" }}>{c.tool}</span>
                <span>{c.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center", flexWrap: "wrap" }}>
        {onRerun && (
          <button className="btn btn-ghost btn-sm" onClick={onRerun}>
            Re-run safety check
          </button>
        )}
        {history.length > 0 && (
          <span className="text-dim" style={{ fontSize: "11px" }}>
            {history.length} persisted audit{history.length === 1 ? "" : "s"} — latest #{history[0]?.auditId} ({history[0]?.recommendation})
          </span>
        )}
      </div>
    </div>
  );
}
