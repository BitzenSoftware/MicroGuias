-- =====================================================================
-- Micro Guias — Migração 050: Cursos (ebook com PDF por módulo)
--   Quando is_curso = true, o conteúdo é entregue em módulos (1 PDF cada),
--   lidos online na Biblioteca. O pdf_url principal passa a ser opcional.
-- =====================================================================

alter table loja_ebooks add column if not exists is_curso boolean not null default false;

create table if not exists loja_ebook_modulos (
  id            uuid primary key default gen_random_uuid(),
  ebook_id      uuid not null references loja_ebooks(id) on delete cascade,
  titulo        text not null,
  ordem         integer not null default 0,
  arquivo_path  text not null,          -- caminho no bucket privado 'pdfs' (pasta modulos/)
  criado_em     timestamptz not null default now()
);

create index if not exists idx_loja_ebook_modulos_ebook on loja_ebook_modulos(ebook_id, ordem);

-- RLS: leitura pública apenas dos METADADOS (título/ordem) para anunciar
-- "curso com N módulos" na loja. O PDF é privado e sai só via API (signed
-- URL) após validação de posse. Admin usa service role.
alter table loja_ebook_modulos enable row level security;

drop policy if exists "ebook_modulos_public_read" on loja_ebook_modulos;
create policy "ebook_modulos_public_read" on loja_ebook_modulos
  for select to anon, authenticated
  using (true);
