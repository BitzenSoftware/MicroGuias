-- =====================================================================
-- Micro Guias — Migração 040: Trigger de criação de perfil à prova de falha
-- Se o insert em loja_perfis falhar, NÃO derruba o signup do utilizador.
-- Resolve o erro "Database error saving new user" (rollback da transação).
-- =====================================================================

create or replace function loja_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.loja_perfis (id, email, nome)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(coalesce(new.email, 'user'), '@', 1)
      )
    )
    on conflict (id) do nothing;
  exception when others then
    -- Nunca bloqueia a criação do utilizador por causa do perfil.
    raise warning 'loja_handle_new_user falhou para %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists loja_on_auth_user_created on auth.users;
create trigger loja_on_auth_user_created
  after insert on auth.users
  for each row execute procedure loja_handle_new_user();

-- Garante que a role authenticated/anon pode inserir via security definer
-- (a função roda como owner, mas reforçamos o grant na tabela)
grant insert, select, update on public.loja_perfis to authenticated;
