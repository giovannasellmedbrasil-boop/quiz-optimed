// Funções compartilhadas pelas rotas da API (arquivos com "_" não viram rota).
import { createHmac, timingSafeEqual } from "node:crypto";

export const ID_RE = /^[a-f0-9-]{36}$/;

export function sendJson(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store");
  res.json(body);
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Painel admin: senha enviada no cabeçalho x-admin-password.
export function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(req.headers["x-admin-password"] || "", expected);
}

// Assinatura para os links de foto (uma <img> não consegue mandar cabeçalho).
export function signPath(pathname) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "")
    .update(pathname)
    .digest("hex")
    .slice(0, 32);
}

export function isValidSignature(pathname, sig) {
  return !!process.env.ADMIN_PASSWORD && safeEqual(signPath(pathname), sig || "");
}

export async function readRawBody(req, limitBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new Error("too_large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
