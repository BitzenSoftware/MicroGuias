-- =====================================================================
-- Micro Guias — Migração 048: capa do bônus
--   Imagem de capa (pública) para exibir o bônus na loja e na Biblioteca.
-- =====================================================================

alter table loja_ebook_bonus add column if not exists capa_url text;
