-- =====================================================================
-- Micro Guias — Migração 049: Chat de suporte (cliente ↔ admin)
--   Uma conversa por cliente. O admin responde a todas.
-- =====================================================================

create table if not exists loja_conversas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (user_id)
);

create table if not exists loja_mensagens (
  id          uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references loja_conversas(id) on delete cascade,
  autor_id    uuid not null references auth.users(id) on delete cascade,
  de_admin    boolean not null default false,
  texto       text not null,
  lida        boolean not null default false,
  criado_em   timestamptz not null default now()
);

create index if not exists idx_loja_mensagens_conversa on loja_mensagens(conversa_id, criado_em);
create index if not exists idx_loja_conversas_atualizado on loja_conversas(atualizado_em desc);

-- RLS habilitado; todo acesso passa pelas rotas do servidor (service role),
-- que validam o dono da conversa / papel de admin. Sem policy pública.
alter table loja_conversas enable row level security;
alter table loja_mensagens enable row level security;
