-- =====================================================================
-- Micro Guias — Migração 039: Backfill de perfis + reforço do trigger
-- Cria perfil para utilizadores que já existiam em auth.users antes do
-- trigger ser instalado (ex: primeiro login Google).
-- Idempotente: pode rodar várias vezes sem problema.
-- =====================================================================

-- 1) Garante a tabela (caso a 038 não tenha sido aplicada)
create table if not exists loja_perfis (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text not null,
  nome      text,
  role      text not null default 'customer'
              check (role in ('customer', 'admin')),
  criado_em timestamptz not null default now()
);

-- 2) Garante a função do trigger
create or replace function loja_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into loja_perfis (id, email, nome)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3) Garante o trigger
drop trigger if exists loja_on_auth_user_created on auth.users;
create trigger loja_on_auth_user_created
  after insert on auth.users
  for each row execute procedure loja_handle_new_user();

-- 4) BACKFILL — cria perfil para todos os utilizadores existentes
insert into loja_perfis (id, email, nome)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  )
from auth.users u
on conflict (id) do nothing;

-- 5) Define o admin (ajuste o email se necessário)
update loja_perfis set role = 'admin'
where email = 'diegocatelli87@gmail.com';
