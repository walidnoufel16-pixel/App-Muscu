-- Admin : la liste renvoie aussi le journal (LOG) pour que l'app reconstruise
-- l'historique des comptes anciens, et l'admin peut supprimer un compte.
-- Chaque suppression est notée dans admin_journal (inaccessible depuis l'app,
-- écrit par la fonction Edge « supprimer » avec la clé de service).

create or replace function public.admin_utilisateurs()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', u.id, 'email', u.email, 'anonyme', coalesce(u.is_anonymous, false),
      'cree', u.created_at, 'connexion', u.last_sign_in_at,
      'pseudo', e.pseudo, 'maj', e.maj, 'etat', coalesce(e.etat, '{}'::jsonb))
      order by coalesce(e.maj, u.created_at) desc)
    from auth.users u
    left join public.etats e on e.user_id = u.id), '[]'::jsonb);
end;
$$;

create table public.admin_journal (
  id      bigint generated always as identity primary key,
  admin   uuid not null,
  action  text not null,
  compte  uuid not null,
  pseudo  text,
  email   text,
  quand   timestamptz not null default now()
);
alter table public.admin_journal enable row level security;
revoke all on public.admin_journal from anon, authenticated;

-- Vérifie qu'un compte peut être supprimé par l'admin qui appelle (jamais
-- soi-même, jamais un autre admin) et renvoie de quoi le noter au journal.
-- La suppression elle-même passe par la fonction Edge « supprimer » (API
-- d'administration d'Auth, comme « oublier ») ; les tables liées suivent en
-- cascade : état, défis créés, participations, quotas.
create function public.admin_verifier_suppression(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  perform public.exiger_admin();
  if p_user = (select auth.uid()) then
    raise exception 'Impossible de supprimer ton propre compte ici' using errcode = '42501';
  end if;
  if exists (select 1 from public.admins where user_id = p_user) then
    raise exception 'Impossible de supprimer un compte admin' using errcode = '42501';
  end if;
  select jsonb_build_object('pseudo', e.pseudo, 'email', u.email) into v
    from auth.users u left join public.etats e on e.user_id = u.id where u.id = p_user;
  if v is null then
    raise exception 'Compte introuvable' using errcode = 'P0002';
  end if;
  return v;
end;
$$;

revoke all on function public.admin_verifier_suppression(uuid) from public, anon;
grant execute on function public.admin_verifier_suppression(uuid) to authenticated;
