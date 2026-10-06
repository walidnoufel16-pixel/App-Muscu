-- Accès admin, en lecture seule. Les règles de sécurité existantes ne changent pas :
-- chaque compte ne voit toujours que ses données. L'admin passe par des fonctions
-- qui vérifient d'abord que l'appelant figure dans public.admins. Cette table n'est
-- accessible ni en lecture ni en écriture depuis l'app : on y ajoute un compte à la
-- main, dans l'éditeur SQL de Supabase.

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cree    timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Sert à afficher (ou non) l'entrée Admin dans Profil.
create function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create function public.exiger_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = (select auth.uid())) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
end;
$$;

-- Tous les comptes, avec leur état sans le journal détaillé des séries (LOG, volumineux).
create function public.admin_utilisateurs()
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
      'pseudo', e.pseudo, 'maj', e.maj, 'etat', coalesce(e.etat, '{}'::jsonb) - 'LOG')
      order by coalesce(e.maj, u.created_at) desc)
    from auth.users u
    left join public.etats e on e.user_id = u.id), '[]'::jsonb);
end;
$$;

-- Un compte en détail : état complet et défis suivis.
create function public.admin_etat(p_user uuid)
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

-- Chiffres du service : générations par IA, cache, défis, séances partagées.
create function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return jsonb_build_object(
    'generations', coalesce((
      select jsonb_agg(jsonb_build_object('jour', jour, 'n', n, 'comptes', comptes) order by jour)
      from (select jour, sum(n)::int as n, count(*)::int as comptes from public.quotas_generation
            where jour > current_date - 30 group by jour) g), '[]'::jsonb),
    'cache', (select count(*) from public.plans_cache),
    'defis', coalesce((
      select jsonb_agg(jsonb_build_object('code', d.code, 'nom', d.nom, 'type', d.type, 'cible', d.cible,
                                          'debut', d.debut, 'fin', d.fin,
                                          'participants', (select count(*) from public.defis_participants p where p.code = d.code))
                       order by d.fin desc)
      from public.defis d), '[]'::jsonb),
    'partages', (select count(*) from public.seances_partagees),
    'partages_recents', coalesce((
      select jsonb_agg(jsonb_build_object('nom', s.nom, 'cree', s.cree) order by s.cree desc)
      from (select nom, cree from public.seances_partagees order by cree desc limit 20) s), '[]'::jsonb));
end;
$$;

revoke all on function public.est_admin(), public.exiger_admin(), public.admin_utilisateurs(),
  public.admin_etat(uuid), public.admin_stats() from public, anon;
revoke all on function public.exiger_admin() from authenticated;
grant execute on function public.est_admin(), public.admin_utilisateurs(), public.admin_etat(uuid),
  public.admin_stats() to authenticated;
