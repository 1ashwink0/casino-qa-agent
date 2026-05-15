const BASE = "http://localhost:8000";

export const askAgent = async (question, domainHint = null) => {
  const res = await fetch(`${BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, domain_hint: domainHint }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getHistory = async () => {
  const res = await fetch(`${BASE}/history`);
  return res.json();
};

export const getSchemaTables = async () => {
  const res = await fetch(`${BASE}/schema/tables`);
  return res.json();
};

export const ingestSchema = async (schemaJson) => {
  const res = await fetch(`${BASE}/schema/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schemaJson),
  });
  return res.json();
};