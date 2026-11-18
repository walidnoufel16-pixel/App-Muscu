-- Les statistiques de l'Admin repartent du 18/11/2026 à 1 h (Paris), juste avant l'arrivée de Mel,
-- la première vraie testeuse, à la demande de l'admin :
-- tous les comptes et appareils d'avant sont ceux de proches.
-- 1. Les comptes déjà là sont écartés des chiffres des testeurs (testeurs.exclu).
-- 2. admin_vue ne compte que les événements à partir de cette heure, et écarte les appareils
--    déjà vus avant (ceux des proches), même s'ils reviennent ensuite.
-- Script relançable sans erreur.

update public.testeurs set exclu = true where confirme < '2026-11-18T00:00:00Z';
-- Mel (confirmée à 1 h 04) compte, même si une version précédente de ce script l'avait écartée
update public.testeurs set exclu = false where user_id = '69a4d0c6-627b-4a1b-9e6a-b37fb88a267d';

create or replace function public.admin_vue(p_jours int, p_avec_moi boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  debut constant timestamptz := '2026-11-18T00:00:00Z';
  auj date := (now() at time zone 'Europe/Paris')::date;
  d0 date := auj - greatest(1, least(coalesce(p_jours, 30), 3650)) + 1;
begin
  perform public.exiger_admin();
  return (
    with ev as (
      select * from public.evenements e
      where e.jour >= d0 and e.cree >= debut
        and not exists (select 1 from public.evenements o where o.appareil = e.appareil and o.cree < debut)
        and (p_avec_moi or not exists (select 1 from public.mesure_exclus x where x.appareil = e.appareil))
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
