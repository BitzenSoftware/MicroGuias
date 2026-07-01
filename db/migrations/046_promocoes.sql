-- =====================================================================
-- Micro Guias — Migração 046: Promoções / Combos
--   Um combo = conjunto de ebooks vendido por um preço fixo promocional.
--   Compra direta (não passa pelo carrinho comum).
-- =====================================================================

create table if not exists loja_promocoes (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  slug           text not null unique,
  descricao      text,
  preco_centavos integer not null check (preco_centavos > 0),
  capa_url       text,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

create table if not exists loja_promocao_itens (
  id           uuid primary key default gen_random_uuid(),
  promocao_id  uuid not null references loja_promocoes(id) on delete cascade,
  ebook_id     uuid not null references loja_ebooks(id) on delete cascade,
  unique (promocao_id, ebook_id)
);

create index if not exists idx_loja_promocao_itens_promocao on loja_promocao_itens(promocao_id);
create index if not exists idx_loja_promocao_itens_ebook on loja_promocao_itens(ebook_id);

-- (Opcional) marca o pedido que veio de um combo, para relatório
alter table loja_pedidos add column if not exists promocao_id uuid references loja_promocoes(id);

-- ---------------------------------------------------------------------
-- RLS: leitura pública apenas de combos ATIVOS. Admin usa service role.
-- ---------------------------------------------------------------------
alter table loja_promocoes enable row level security;
alter table loja_promocao_itens enable row level security;

drop policy if exists "promocoes_public_read" on loja_promocoes;
create policy "promocoes_public_read" on loja_promocoes
  for select to anon, authenticated
  using (ativo = true);

drop policy if exists "promocao_itens_public_read" on loja_promocao_itens;
create policy "promocao_itens_public_read" on loja_promocao_itens
  for select to anon, authenticated
  using (true);
