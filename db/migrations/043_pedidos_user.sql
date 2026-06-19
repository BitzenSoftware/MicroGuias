-- =====================================================================
-- Micro Guias — Migração 043: vincula pedidos ao utilizador
-- Permite ao cliente ver suas compras e baixar os ebooks após pagar.
-- =====================================================================

alter table loja_pedidos
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_loja_pedidos_user on loja_pedidos(user_id);
create index if not exists idx_loja_pedido_itens_pedido on loja_pedido_itens(pedido_id);
create index if not exists idx_loja_downloads_item on loja_downloads(pedido_item_id);
