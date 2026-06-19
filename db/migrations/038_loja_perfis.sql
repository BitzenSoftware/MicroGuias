-- =====================================================================
-- Micro Guias — Migração 038: Perfis de utilizadores e roles
-- role: 'customer' (comprador) | 'admin' (super admin)
-- =====================================================================

create table if not exists loja_perfis (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text not null,
  nome      text,
  role      text not null default 'customer'
              check (role in ('customer', 'admin')),
  criado_em timestamptz not null default now()
);

-- Cria perfil automaticamente quando um utilizador se cadastra
-- (funciona para Google OAuth e email/senha)
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

drop trigger if exists loja_on_auth_user_created on auth.users;
create trigger loja_on_auth_user_created
  after insert on auth.users
  for each row execute procedure loja_handle_new_user();

-- RLS
alter table loja_perfis enable row level security;

create policy "loja_perfis_own_read" on loja_perfis
  for select to authenticated
  using (auth.uid() = id);

create policy "loja_perfis_own_update" on loja_perfis
  for update to authenticated
  using (auth.uid() = id);

-- Para definir um admin, rode manualmente no Supabase:
-- UPDATE loja_perfis SET role = 'admin' WHERE email = 'seu@email.com';
