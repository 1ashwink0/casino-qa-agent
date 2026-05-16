import { useState } from "react";
import SchemaUploader from "./components/SchemaUploader";
import ChatWindow from "./components/ChatWindow";
import QueryResult from "./components/QueryResult";
import { askAgent } from "./api/agent";

const styles = {
  app:           { fontFamily: "'Inter', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" },
  header:        { background: "#1e293b", borderBottom: "1px solid #334155", padding: "16px 24px" },
  headerInner:   { display: "flex", alignItems: "center", gap: 16, maxWidth: 960, margin: "0 auto" },
  logo:          { fontSize: 36 },
  title:         { margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9" },
  subtitle:      { margin: 0, fontSize: 13, color: "#94a3b8" },
  main:          { maxWidth: 960, margin: "24px auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 },
  error:         { background: "#450a0a", border: "1px solid #991b1b", borderRadius: 8, padding: 12, color: "#fca5a5" },
};

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAsk = async (question, domain) => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await askAgent(question, domain === "auto" ? null : domain);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
        <SchemaUploader />
        <ChatWindow onAsk={handleAsk} loading={loading} />
        {error && <div style={styles.error}>{error}</div>}
        {result && <QueryResult result={result} />}
      </main>
    </div>
  );
}
