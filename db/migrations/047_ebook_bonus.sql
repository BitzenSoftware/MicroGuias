-- =====================================================================
-- Micro Guias — Migração 047: Bônus dos ebooks
--   Arquivos extras (PDF, planilha…) anexados a um ebook.
--   Diferente do ebook principal (leitura online), o bônus é para BAIXAR.
--   Entrega: apenas para quem comprou (via API com signed URL de download).
-- =====================================================================

create table if not exists loja_ebook_bonus (
  id            uuid primary key default gen_random_uuid(),
  ebook_id      uuid not null references loja_ebooks(id) on delete cascade,
  nome          text not null,
  arquivo_path  text not null,          -- caminho no bucket privado 'pdfs' (pasta bonus/)
  criado_em     timestamptz not null default now()
);

create index if not exists idx_loja_ebook_bonus_ebook on loja_ebook_bonus(ebook_id);

-- RLS: leitura pública apenas dos METADADOS (nome) — útil para anunciar
-- "inclui bônus" na loja. O ARQUIVO em si é privado e só sai via API
-- (signed URL) após validação de posse. Admin usa service role.
alter table loja_ebook_bonus enable row level security;

drop policy if exists "ebook_bonus_public_read" on loja_ebook_bonus;
create policy "ebook_bonus_public_read" on loja_ebook_bonus
  for select to anon, authenticated
  using (true);
