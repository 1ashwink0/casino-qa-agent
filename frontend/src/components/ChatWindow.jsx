import { useState } from "react";

const DOMAIN_OPTIONS = ["auto", "wallet", "bonus", "player", "transaction", "game"];

const EXAMPLE_QUESTIONS = [
  "Find failed bonus payouts in the last 24 hours",
  "Validate wallet deduction after wager settlement",
  "Find duplicate jackpot payouts",
  "Check inconsistent balances between wallet and ledger",
  "Find players with failed withdrawal reversals",
  "Show players with active bonuses but zero wagering progress",
];

const styles = {
  card:          { background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" },
  row:           { display: "flex", gap: 12, alignItems: "flex-start" },
  select:        { background: "#0f172a", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 13, flexShrink: 0 },
  textarea:      { flex: 1, background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", lineHeight: 1.5, outline: "none" },
  button:        { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", flexShrink: 0, fontSize: 14 },
  buttonDisabled: { background: "#334155", color: "#64748b", cursor: "not-allowed" },
  examples:      { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" },
  exampleLabel:  { fontSize: 12, color: "#64748b" },
  exampleChip:   { background: "#0f172a", border: "1px solid #334155", color: "#94a3b8", borderRadius: 20, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
};

export default function ChatWindow({ onAsk, loading }) {
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState("auto");

  const handleAsk = () => {
    onAsk(question, domain);
  };

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <select value={domain} onChange={(e) => setDomain(e.target.value)} style={styles.select}>
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
        <button
          onClick={handleAsk}
          disabled={loading}
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
        >
          {loading ? "⟳ Generating..." : "Generate SQL"}
        </button>
      </div>

      <div style={styles.examples}>
        <span style={styles.exampleLabel}>Examples: </span>
        {EXAMPLE_QUESTIONS.map((q, i) => (
          <button key={i} style={styles.exampleChip} onClick={() => setQuestion(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
