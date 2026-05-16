import { useState } from "react";

const confidenceColor = {
  HIGH: "#22c55e", MEDIUM: "#f59e0b", LOW: "#ef4444"
};

const styles = {
  card:          { background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" },
  metaRow:       { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  badge:         { borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#fff" },
  tableList:     { fontSize: 12, color: "#64748b" },
  sqlBlock:      { background: "#0f172a", borderRadius: 8, overflow: "hidden", marginBottom: 12 },
  sqlHeader:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: "#1a2744", borderBottom: "1px solid #334155" },
  sqlLabel:      { fontSize: 12, fontWeight: 600, color: "#818cf8" },
  copyBtn:       { background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 4, padding: "3px 10px", fontSize: 11, cursor: "pointer" },
  sqlCode:       { margin: 0, padding: 16, fontSize: 13, overflowX: "auto", lineHeight: 1.6, color: "#a5f3fc", whiteSpace: "pre-wrap" },
  details:       { borderTop: "1px solid #1e3a5f", paddingTop: 8, marginTop: 8 },
  summary:       { cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#94a3b8", padding: "4px 0" },
  detailContent: { fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, marginTop: 6, whiteSpace: "pre-wrap" },
};

export default function QueryResult({ result }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.card}>
      <div style={styles.metaRow}>
        <span style={{ ...styles.badge, background: confidenceColor[result.confidence] }}>
          {result.confidence} CONFIDENCE
        </span>
        <span style={styles.tableList}>
          Tables: {result.tables_used?.join(", ")}
        </span>
      </div>

      <div style={styles.sqlBlock}>
        <div style={styles.sqlHeader}>
          <span style={styles.sqlLabel}>T-SQL Query</span>
          <button onClick={handleCopy} style={styles.copyBtn}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <pre style={styles.sqlCode}>{result.sql}</pre>
      </div>

      {[
        { label: "📋 Explanation",       value: result.explanation },
        { label: "🔗 Joins Used",         value: result.joins_used?.join("\n") },
        { label: "✅ Validation Notes",   value: result.validation_notes },
        { label: "⚠️ Edge Cases",         value: result.edge_cases },
        { label: "📌 Assumptions",        value: result.assumptions },
      ].map(({ label, value }) => value && (
        <details key={label} style={styles.details}>
          <summary style={styles.summary}>{label}</summary>
          <p style={styles.detailContent}>{value}</p>
        </details>
      ))}
    </div>
  );
}
