import { useState, useEffect, useRef } from "react";
import { getSchemaTables, ingestSchema } from "../api/agent";

const styles = {
  card:    { background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" },
  header:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title:   { margin: 0, fontSize: 16, fontWeight: 600, color: "#f1f5f9" },
  actions: { display: "flex", gap: 8 },
  btn:     { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  btnOut:  { background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  list:    { display: "flex", flexDirection: "column", gap: 4 },
  row:     { fontSize: 13, color: "#94a3b8", display: "flex", justifyContent: "space-between", padding: "4px 0" },
  empty:   { fontSize: 13, color: "#64748b", fontStyle: "italic" },
  tag:     { background: "#0f172a", border: "1px solid #334155", borderRadius: 4, padding: "1px 6px", fontSize: 11, color: "#818cf8" },
  hidden:  { display: "none" },
  status:  { fontSize: 12, color: "#22c55e", marginBottom: 8 },
  err:     { fontSize: 12, color: "#fca5a5", marginBottom: 8 },
};

export default function SchemaUploader() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isError, setIsError] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadTables(); }, []);

  const loadTables = async () => {
    try {
      const data = await getSchemaTables();
      setTables(data);
    } catch { setTables([]); }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatus(null);
    setIsError(false);
    try {
      const text = await file.text();
      const schema = JSON.parse(text);
      const result = await ingestSchema(schema);
      await loadTables();
      setStatus(`Ingested ${result.tables_ingested} tables`);
    } catch (err) {
      setIsError(true);
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Schema Metadata</h3>
        <div style={styles.actions}>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            style={styles.btnOut}
          >
            {loading ? "Loading..." : "Upload JSON"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            style={styles.hidden}
          />
        </div>
      </div>

      {status && <p style={isError ? styles.err : styles.status}>{status}</p>}

      {tables.length === 0 ? (
        <p style={styles.empty}>No tables loaded. Upload a casino schema JSON file to get started.</p>
      ) : (
        <div style={styles.list}>
          {tables.map((t, i) => (
            <div key={i} style={styles.row}>
              <span>{t.table_name}</span>
              <span><span style={styles.tag}>{t.domain_category}</span> ({t.column_count} cols)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
