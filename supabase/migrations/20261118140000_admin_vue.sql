-- Admin en 3 onglets (Vue d'ensemble · Testeurs · Technique).
-- 1. Les appareils de l'admin sont écartés des chiffres anonymes : l'app de l'admin inscrit son
--    identifiant d'appareil (tiré au hasard, sans lien avec le compte) dans mesure_exclus.
-- 2. Les comptes de l'admin et ses comptes de test sont écartés des chiffres des testeurs
--    (testeurs.exclu, et la table admins).
-- 3. admin_vue(jours, avec_moi) : visiteurs, visite guidée, sources et rubriques sur la période.

create table public.mesure_exclus (
  appareil text primary key check (appareil ~ '^[a-z0-9]{8,32}$'),
  cree     timestamptz not null default now()
);
alter table public.mesure_exclus enable row level security;
revoke all on public.mesure_exclus from anon, authenticated;

create function public.admin_exclure_appareil(p_appareil text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  if p_appareil is null or p_appareil !~ '^[a-z0-9]{8,32}$' then return; end if;
  insert into public.mesure_exclus (appareil) values (p_appareil) on conflict do nothing;
end;
$$;
revoke all on function public.admin_exclure_appareil(text) from public, anon;
grant execute on function public.admin_exclure_appareil(text) to authenticated;

alter table public.testeurs add column exclu boolean not null default false;
update public.testeurs set exclu = true where user_id in (select user_id from public.admins);
update public.testeurs t set exclu = true from public.etats e
  where e.user_id = t.user_id and e.pseudo ilike 'walid-test%';

-- comptes écartés des chiffres : les admins et les comptes de test
create function public.admin_comptes_exclus()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return coalesce((select jsonb_agg(user_id) from (
    select user_id from public.admins
    union select user_id from public.testeurs where exclu) s), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_comptes_exclus() from public, anon;
grant execute on function public.admin_comptes_exclus() to authenticated;

-- marquer (ou non) un compte comme compte de test, depuis sa fiche
create function public.admin_compte_test(p_user uuid, p_test boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  insert into public.testeurs (user_id, signale, bienvenue, exclu) values (p_user, true, true, p_test)
    on conflict (user_id) do update set exclu = p_test;
end;
$$;
revoke all on function public.admin_compte_test(uuid, boolean) from public, anon;
grant execute on function public.admin_compte_test(uuid, boolean) to authenticated;

create function public.admin_vue(p_jours int, p_avec_moi boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  auj date := (now() at time zone 'Europe/Paris')::date;
  d0 date := auj - greatest(1, least(coalesce(p_jours, 30), 3650)) + 1;
begin
  perform public.exiger_admin();
  return (
    with ev as (
      select * from public.evenements e
      where e.jour >= d0 and (p_avec_moi or not exists (select 1 from public.mesure_exclus x where x.appareil = e.appareil))
    ), premier as (
      select distinct on (appareil) appareil, jour, coalesce(nullif(props->>'src', ''), '') as src
      from ev where nom = 'ouverture' order by appareil, jour, id
    )
    select jsonb_build_object(
      'visiteurs', (select count(distinct appareil) from ev where nom = 'ouverture'),
      'visiteurs7', (select count(distinct appareil) from ev where nom = 'ouverture' and jour > auj - 7),
      'visite', (select count(distinct appareil) from ev where nom = 'visite_finie'),
      'sources', coalesce((select jsonb_agg(jsonb_build_object('source', src, 'n', n) order by n desc)
                           from (select src, count(*) as n from premier group by src) s), '[]'::jsonb),
      'rubriques', coalesce((select jsonb_agg(jsonb_build_object('rubrique', r, 'appareils', a) order by a desc)
                             from (select coalesce(props->>'r', '?') as r, count(distinct appareil) as a
                                   from ev where nom = 'rubrique_ouverte' group by 1 order by 2 desc limit 6) s), '[]'::jsonb),
      'erreurs', (select count(*) from public.erreurs where jour > auj - 14)
    )
  );
end;
$$;
revoke all on function public.admin_vue(int, boolean) from public, anon;
grant execute on function public.admin_vue(int, boolean) to authenticated;
