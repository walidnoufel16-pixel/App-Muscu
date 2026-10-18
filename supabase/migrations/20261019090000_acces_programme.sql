-- Programme sur 8 semaines : en pause pour tout le monde, l'admin l'ouvre compte par compte.
-- La table n'est accessible ni en lecture ni en écriture depuis l'app : on passe par
-- programme_autorise() (pour soi) et admin_acces_programme() (admin seulement, noté au journal).

create table public.acces_programme (
  user_id uuid primary key references auth.users (id) on delete cascade,
  accorde timestamptz not null default now(),
  par     uuid
);
alter table public.acces_programme enable row level security;
revoke all on public.acces_programme from anon, authenticated;

-- Le compte connecté a-t-il accès au programme ? Les admins l'ont toujours.
create function public.programme_autorise()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.acces_programme where user_id = (select auth.uid()))
      or exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- Ouvrir ou fermer l'accès d'un compte (admin seulement). Noté dans admin_journal.
create function public.admin_acces_programme(p_user uuid, p_acces boolean)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_mail text;
  v_pseudo text;
begin
  perform public.exiger_admin();
  if p_acces then
    insert into public.acces_programme (user_id, par) values (p_user, (select auth.uid()))
    on conflict (user_id) do nothing;
  else
    delete from public.acces_programme where user_id = p_user;
  end if;
  select u.email, e.pseudo into v_mail, v_pseudo
  from auth.users u left join public.etats e on e.user_id = u.id where u.id = p_user;
  insert into public.admin_journal (admin, action, compte, pseudo, email)
  values ((select auth.uid()), case when p_acces then 'programme_ouvert' else 'programme_ferme' end, p_user, v_pseudo, v_mail);
  return p_acces;
end;
$$;

-- La liste et la fiche admin disent si le compte a l'accès.
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
      'pseudo', e.pseudo, 'maj', e.maj, 'etat', coalesce(e.etat, '{}'::jsonb),
      'programme', exists (select 1 from public.acces_programme a where a.user_id = u.id))
      order by coalesce(e.maj, u.created_at) desc)
    from auth.users u
    left join public.etats e on e.user_id = u.id), '[]'::jsonb);
end;
$$;

create or replace function public.admin_etat(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return (
    select jsonb_build_object(
      'id', u.id, 'email', u.email, 'anonyme', coalesce(u.is_anonymous, false),
      'cree', u.created_at, 'connexion', u.last_sign_in_at,
      'pseudo', e.pseudo, 'maj', e.maj, 'etat', coalesce(e.etat, '{}'::jsonb),
      'programme', exists (select 1 from public.acces_programme a where a.user_id = u.id),
      'defis', coalesce((
        select jsonb_agg(jsonb_build_object('code', d.code, 'nom', d.nom, 'type', d.type, 'cible', d.cible,
                                            'debut', d.debut, 'fin', d.fin, 'score', p.score) order by d.fin desc)
        from public.defis_participants p join public.defis d on d.code = p.code
        where p.user_id = u.id), '[]'::jsonb),
      'generations', coalesce((
        select jsonb_agg(jsonb_build_object('jour', q.jour, 'n', q.n) order by q.jour desc)
        from public.quotas_generation q where q.user_id = u.id), '[]'::jsonb))
    from auth.users u
    left join public.etats e on e.user_id = u.id
    where u.id = p_user);
end;
$$;

revoke all on function public.programme_autorise(), public.admin_acces_programme(uuid, boolean) from public, anon;
grant execute on function public.programme_autorise(), public.admin_acces_programme(uuid, boolean) to authenticated;
