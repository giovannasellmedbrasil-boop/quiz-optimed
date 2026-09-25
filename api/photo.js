// Recebe UMA foto (JPEG já reduzido no aparelho) de um participante.
// POST /api/photo?id=<uuid da participação>&n=<1..5>   corpo: bytes do JPEG
import { put } from "@vercel/blob";
import { ID_RE, readRawBody, sendJson } from "./_lib.js";

export const config = { api: { bodyParser: false } };

const MAX_PHOTOS = 5;
const MAX_BYTES = 4 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { status: "error", message: "method" });

  const id = String(req.query.id || "");
  const n = Number(req.query.n);
  if (!ID_RE.test(id) || !Number.isInteger(n) || n < 1 || n > MAX_PHOTOS) {
    return sendJson(res, 400, { status: "error", message: "parâmetros inválidos" });
  }

  let body;
  try {
    body = await readRawBody(req, MAX_BYTES);
  } catch {
    return sendJson(res, 413, { status: "error", message: "foto muito grande" });
  }
  // Confere a assinatura de um JPEG (FF D8 FF).
  if (body.length < 3 || body[0] !== 0xff || body[1] !== 0xd8 || body[2] !== 0xff) {
    return sendJson(res, 400, { status: "error", message: "formato inválido" });
  }

  const blob = await put(`fotos/${id}/foto-${n}.jpg`, body, {
    access: "private",
    contentType: "image/jpeg",
    addRandomSuffix: false,
    allowOverwrite: true, // reenvio após falha de internet sobrescreve a mesma foto
  });
  return sendJson(res, 200, { status: "ok", pathname: blob.pathname });
}
