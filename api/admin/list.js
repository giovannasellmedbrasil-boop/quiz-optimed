// Painel admin: devolve todas as participações, mais recentes primeiro,
// com links temporários (7 dias) para as fotos privadas.
// GET /api/admin/list   cabeçalho: x-admin-password
import { BUCKET, isAdmin, sendJson, supabase } from "../_lib.js";

const LINK_SECONDS = 7 * 24 * 60 * 60;

export default async function handler(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { status: "error", message: "senha incorreta" });

  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("respostas")
      .select("*")
      .order("enviado_em", { ascending: false })
      .range(from, from + 999);
    if (error) return sendJson(res, 500, { status: "error", message: "falha ao ler" });
    rows.push(...data);
    if (data.length < 1000) break;
  }

  const paths = rows.flatMap((r) => r.fotos || []);
  const urlByPath = {};
  for (let i = 0; i < paths.length; i += 500) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths.slice(i, i + 500), LINK_SECONDS);
    (data || []).forEach((s) => { if (s.signedUrl) urlByPath[s.path] = s.signedUrl; });
  }

  const records = rows.map((r) => ({
    id: r.id,
    submittedAt: r.enviado_em,
    fullName: r.nome,
    crm: r.crm,
    phone: r.celular,
    stand: r.stand,
    consent: r.aceite_dados,
    newsletter: r.newsletter,
    photoUrls: (r.fotos || []).map((p) => urlByPath[p]).filter(Boolean),
  }));
  return sendJson(res, 200, { status: "ok", records });
}
