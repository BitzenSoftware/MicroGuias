-- =====================================================================
-- Micro Guias — Migração 042: guarda o conteúdo gerado pelo Gemini
-- Permite regenerar o PDF depois (ex: ao editar o título).
-- =====================================================================

alter table loja_ebooks
  add column if not exists conteudo jsonb;
