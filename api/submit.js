// Grava a participação (dados do formulário) depois que as fotos subiram.
// POST /api/submit   corpo JSON: { id, fullName, crm, phone, stand, consent, newsletter }
import { list, put } from "@vercel/blob";
import { ID_RE, sendJson } from "./_lib.js";

const STANDS = ["Sellmed", "Optimed"];

function clean(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { status: "error", message: "method" });

  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { data = null; }
  }
  if (!data || typeof data !== "object") return sendJson(res, 400, { status: "error", message: "JSON inválido" });

  const id = String(data.id || "");
  const record = {
    id,
    fullName: clean(data.fullName, 120),
    crm: clean(data.crm, 30).toUpperCase(),
    phone: clean(data.phone, 30),
    stand: clean(data.stand, 20),
    consent: data.consent === true,
    newsletter: data.newsletter === true,
  };
  if (!ID_RE.test(id) || record.fullName.length < 3 || !record.crm || record.phone.replace(/\D/g, "").length < 10 ||
      !STANDS.includes(record.stand) || !record.consent) {
    return sendJson(res, 400, { status: "error", message: "dados incompletos" });
  }

  // Só entram as fotos que realmente chegaram ao armazenamento, até a quantidade
  // da tentativa final (sobras de uma tentativa anterior com mais fotos ficam de fora).
  const photoCount = Math.min(Math.max(Number(data.photoCount) || 0, 0), 5);
  const expected = new Set(Array.from({ length: photoCount }, (_, i) => `fotos/${id}/foto-${i + 1}.jpg`));
  const { blobs } = await list({ prefix: `fotos/${id}/` });
  record.photos = blobs.map((b) => b.pathname).filter((p) => expected.has(p)).sort();
  if (record.photos.length !== photoCount || !photoCount) {
    return sendJson(res, 400, { status: "error", message: "fotos incompletas" });
  }

  record.submittedAt = new Date().toISOString();
  await put(`respostas/${id}.json`, JSON.stringify(record, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return sendJson(res, 200, { status: "ok" });
}
