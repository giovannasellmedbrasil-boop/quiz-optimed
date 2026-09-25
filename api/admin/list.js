// Painel admin: devolve todas as participações, mais recentes primeiro.
// GET /api/admin/list   cabeçalho: x-admin-password
import { get, list } from "@vercel/blob";
import { isAdmin, sendJson, signPath } from "../_lib.js";

async function readJson(pathname) {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text());
}

export default async function handler(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { status: "error", message: "senha incorreta" });

  const paths = [];
  let cursor;
  do {
    const page = await list({ prefix: "respostas/", cursor, limit: 1000 });
    page.blobs.forEach((b) => paths.push(b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const records = [];
  for (let i = 0; i < paths.length; i += 20) {
    const batch = await Promise.all(paths.slice(i, i + 20).map((p) => readJson(p).catch(() => null)));
    batch.forEach((r) => r && records.push(r));
  }

  records.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
  records.forEach((r) => {
    r.photoUrls = (r.photos || []).map(
      (p) => `/api/admin/photo?path=${encodeURIComponent(p)}&sig=${signPath(p)}`
    );
  });
  return sendJson(res, 200, { status: "ok", records });
}
