import { useState, useRef } from "react";
import { askAgent, getHistory } from "./api/agent";

const DOMAIN_OPTIONS = ["auto", "wallet", "bonus", "player", "transaction", "game"];

const EXAMPLE_QUESTIONS = [
  "Find failed bonus payouts in the last 24 hours",
  "Validate wallet deduction after wager settlement",
  "Find duplicate jackpot payouts",
  "Check inconsistent balances between wallet and ledger",
  "Find players with failed withdrawal reversals",
  "Show players with active bonuses but zero wagering progress",
];

export default function App() {
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState("auto");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await askAgent(question, domain === "auto" ? null : domain);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor = {
    HIGH: "#22c55e", MEDIUM: "#f59e0b", LOW: "#ef4444"
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>🎲</span>
          <div>
            <h1 style={styles.title}>Casino QA SQL Intelligence Agent</h1>
            <p style={styles.subtitle}>Schema-aware T-SQL generation for casino platform QA</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Input */}
        <div style={styles.card}>
          <div style={styles.row}>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              style={styles.select}
            >
              {DOMAIN_OPTIONS.map(d => (
                <option key={d} value={d}>{d.toUpperCase()}</option>
              ))}
            </select>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a QA validation question... e.g. Find players with failed withdrawal reversals"
              style={styles.textarea}
              rows={3}
              onKeyDown={(e) => { if (e.ctrlKey && e.key === "Enter") handleAsk(); }}
            />
            <button onClick={handleAsk} disabled={loading} style={styles.button}>
              {loading ? "⟳ Generating..." : "Generate SQL"}
            </button>
          </div>

          <div style={styles.examples}>
            <span style={styles.exampleLabel}>Examples: </span>
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <button key={i} style={styles.exampleChip}
                onClick={() => setQuestion(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {result && (
          <div style={styles.card}>
            {/* Confidence badge */}
            <div style={styles.metaRow}>
              <span style={{
                ...styles.badge,
                background: confidenceColor[result.confidence]
              }}>
                {result.confidence} CONFIDENCE
              </span>
              <span style={styles.tableList}>
                Tables: {result.tables_used?.join(", ")}
              </span>
            </div>

            {/* SQL Block */}
            <div style={styles.sqlBlock}>
              <div style={styles.sqlHeader}>
                <span style={styles.sqlLabel}>T-SQL Query</span>
                <button onClick={handleCopy} style={styles.copyBtn}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre style={styles.sqlCode}>{result.sql}</pre>
            </div>

            {/* Explanation panels */}
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
        )}
      </main>
    </div>
  );
}

const styles = {
  app:           { fontFamily: "'Inter', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" },
  header:        { background: "#1e293b", borderBottom: "1px solid #334155", padding: "16px 24px" },
  headerInner:   { display: "flex", alignItems: "center", gap: 16, maxWidth: 960, margin: "0 auto" },
  logo:          { fontSize: 36 },
  title:         { margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9" },
  subtitle:      { margin: 0, fontSize: 13, color: "#94a3b8" },
  main:          { maxWidth: 960, margin: "24px auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 },
  card:          { background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" },
  row:           { display: "flex", gap: 12, alignItems: "flex-start" },
  select:        { background: "#0f172a", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 13, flexShrink: 0 },
  textarea:      { flex: 1, background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", lineHeight: 1.5 },
  button:        { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  examples:      { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" },
  exampleLabel:  { fontSize: 12, color: "#64748b" },
  exampleChip:   { background: "#0f172a", border: "1px solid #334155", color: "#94a3b8", borderRadius: 20, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
  error:         { background: "#450a0a", border: "1px solid #991b1b", borderRadius: 8, padding: 12, color: "#fca5a5" },
  metaRow:       { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  badge:         { borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#fff" },
  tableList:     { fontSize: 12, color: "#64748b" },
  sqlBlock:      { background: "#0f172a", borderRadius: 8, overflow: "hidden", marginBottom: 12 },
  sqlHeader:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: "#1a2744", borderBottom: "1px solid #334155" },
  sqlLabel:      { fontSize: 12, fontWeight: 600, color: "#818cf8" },
  copyBtn:       { background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 4, padding: "3px 10px", fontSize: 11, cursor: "pointer" },
  sqlCode:       { margin: 0, padding: 16, fontSize: 13, overflowX: "auto", lineHeight: 1.6, color: "#a5f3fc" },
  details:       { borderTop: "1px solid #1e3a5f", paddingTop: 8, marginTop: 8 },
  summary:       { cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#94a3b8", padding: "4px 0" },
  detailContent: { fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, marginTop: 6, whiteSpace: "pre-wrap" },
};