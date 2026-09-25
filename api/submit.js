// Grava a participação (dados do formulário) depois que as fotos subiram.
// POST /api/submit   corpo JSON: { id, fullName, crm, phone, stand, consent, newsletter, photoCount }
import { BUCKET, ID_RE, sendJson, supabase } from "./_lib.js";

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
  const row = {
    id,
    nome: clean(data.fullName, 120),
    crm: clean(data.crm, 30).toUpperCase(),
    celular: clean(data.phone, 30),
    stand: clean(data.stand, 20),
    aceite_dados: data.consent === true,
    newsletter: data.newsletter === true,
  };
  if (!ID_RE.test(id) || row.nome.length < 3 || !row.crm || row.celular.replace(/\D/g, "").length < 10 ||
      !STANDS.includes(row.stand) || !row.aceite_dados) {
    return sendJson(res, 400, { status: "error", message: "dados incompletos" });
  }

  // Só entram as fotos que realmente chegaram ao armazenamento, até a quantidade
  // da tentativa final (sobras de uma tentativa anterior com mais fotos ficam de fora).
  const photoCount = Math.min(Math.max(Number(data.photoCount) || 0, 0), 5);
  const expected = Array.from({ length: photoCount }, (_, i) => `foto-${i + 1}.jpg`);
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(id);
  if (listError) return sendJson(res, 500, { status: "error", message: "falha ao conferir fotos" });
  const present = new Set((files || []).map((f) => f.name));
  if (!photoCount || !expected.every((name) => present.has(name))) {
    return sendJson(res, 400, { status: "error", message: "fotos incompletas" });
  }
  row.fotos = expected.map((name) => `${id}/${name}`);
  row.enviado_em = new Date().toISOString();

  const { error } = await supabase.from("respostas").upsert(row);
  if (error) return sendJson(res, 500, { status: "error", message: "falha ao salvar" });
  return sendJson(res, 200, { status: "ok" });
}
