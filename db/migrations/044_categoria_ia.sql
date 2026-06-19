-- =====================================================================
-- Micro Guias — Migração 044: nova categoria "Inteligência Artificial"
-- =====================================================================

insert into loja_categorias (nome, slug, icone_emoji, ordem) values
  ('Inteligência Artificial', 'inteligencia-artificial', '🤖', 7)
on conflict (slug) do nothing;
