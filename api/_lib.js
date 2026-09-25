// Funções compartilhadas pelas rotas da API (arquivos com "_" não viram rota).
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const ID_RE = /^[a-f0-9-]{36}$/;
export const BUCKET = "fotos";

// Cliente com a chave secreta: só existe no servidor, nunca vai para o navegador.
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function sendJson(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store");
  res.json(body);
}

// Painel admin: senha enviada no cabeçalho x-admin-password.
export function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const x = Buffer.from(String(req.headers["x-admin-password"] || ""));
  const y = Buffer.from(expected);
  return x.length === y.length && timingSafeEqual(x, y);
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
