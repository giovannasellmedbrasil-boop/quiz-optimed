# Quiz Stand 38 — 46º Congresso Brasileiro de Angiologia e Cirurgia Vascular

- **Quiz (participantes):** https://quiz-stand-38.vercel.app
- **Painel de respostas (só você):** https://quiz-stand-38.vercel.app/admin.html
  — pede a senha do painel (variável `ADMIN_PASSWORD` na Vercel).

## Fluxo do participante

1. **Aba 1 — Seus dados:** nome completo, CRM, celular, stand (Sellmed ou
   Optimed), aceite de uso dos dados (obrigatório) e newsletter Optimed (opcional).
2. **Aba 2 — Sua foto:** até 5 imagens (galeria ou câmera). As fotos são
   reduzidas no aparelho (máx. 1600 px, JPEG) antes de subir.
3. Tela de agradecimento, que volta ao início sozinha em 25 s.

## Onde os dados ficam

Tudo fica num armazenamento **privado** da Vercel (Vercel Blob,
`quiz-stand-38-respostas`, região São Paulo), na conta/equipe
**sellmed-brasil**, ligado ao projeto `quiz-stand-38`:

```
respostas/<id>.json      dados de cada participação
fotos/<id>/foto-N.jpg    fotos daquela participação
```

Nada fica público: as fotos só abrem pelo painel (links assinados).

## Painel admin

- Contadores (total, por stand, newsletter), busca e filtro por stand.
- Clique numa miniatura para ver/baixar a foto.
- **Baixar planilha:** CSV que abre direto no Excel, com links das fotos.
- **Baixar todas as fotos:** um .zip com uma pasta por participante.

## Arquivos

```
index.html          página do quiz
admin.html          painel de respostas
api/photo.js        recebe cada foto
api/submit.js       grava a participação
api/admin/list.js   lista as participações (exige senha)
api/admin/photo.js  entrega uma foto privada (link assinado)
api/_lib.js         funções compartilhadas
assets/             logos
```

## Manutenção

- **Republicar** depois de editar: nesta pasta, `npx vercel@latest deploy --prod --yes`.
- **Trocar a senha do painel:** Vercel → projeto quiz-stand-38 → Settings →
  Environment Variables → `ADMIN_PASSWORD` → editar, e republicar.
- Limites no topo do `<script>` do `index.html`: `MAX_PHOTOS`, `RESET_SECONDS`
  (se mudar `MAX_PHOTOS`, ajuste também `api/photo.js` e `api/submit.js`).
- Não apague a pasta `.vercel` nem o arquivo `.env.local` (ligam esta pasta
  ao projeto na Vercel).
