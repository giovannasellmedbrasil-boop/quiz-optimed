// Painel admin: entrega uma foto privada, se o link estiver assinado.
// GET /api/admin/photo?path=fotos/...&sig=...[&download=nome.jpg]
import { Readable } from "node:stream";
import { get } from "@vercel/blob";
import { isValidSignature, sendJson } from "../_lib.js";

export default async function handler(req, res) {
  const path = String(req.query.path || "");
  if (!path.startsWith("fotos/") || !isValidSignature(path, String(req.query.sig || ""))) {
    return sendJson(res, 403, { status: "error", message: "link inválido" });
  }

  const result = await get(path, { access: "private" });
  if (!result || result.statusCode !== 200) return sendJson(res, 404, { status: "error", message: "não encontrada" });

  res.setHeader("Content-Type", result.blob.contentType || "image/jpeg");
  res.setHeader("Cache-Control", "private, max-age=86400");
  if (req.query.download) {
    const name = String(req.query.download).replace(/[^\w.\- ]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  }
  Readable.fromWeb(result.stream).pipe(res);
}
