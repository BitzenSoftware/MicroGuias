-- =====================================================================
-- Micro Guias — Migração 041: Buckets de Storage
--   capas → público (imagens de capa exibidas na loja)
--   pdfs  → privado (arquivos entregues só após compra, via signed URL)
-- =====================================================================

-- Buckets
insert into storage.buckets (id, name, public)
values ('capas', 'capas', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

-- Leitura pública das capas
drop policy if exists "capas_public_read" on storage.objects;
create policy "capas_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'capas');

-- Nada de acesso público aos PDFs: entrega é feita via service role
-- (signed URLs gerados no servidor após pagamento confirmado).
-- Não criamos policy de leitura para 'pdfs' de propósito.
