-- Admin › Vue d'ensemble : l'entonnoir des nouveaux visiteurs (mesure anonyme, par appareil).
-- Les appareils apparus sur la période (première ouverture), puis combien d'entre eux ont rempli le
-- profil d'entraînement (plan_genere), fait une première série, terminé une séance, puis une 2e.
-- Une étape n'exige pas la précédente : on peut lancer une séance sans remplir le profil.
-- Mêmes règles que admin_vue : à partir du 18/11/2026, sans les appareils de l'admin (sauf demande).
-- p_src : ne garder que les appareils venus de cette source (?src=), '' pour « sans source ».
-- Lecture seule, réservée à l'admin. Script relançable sans erreur.

create or replace function public.admin_entonnoir(p_jours int, p_avec_moi boolean default false, p_src text default null)
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
      where e.cree >= debut
        and (p_avec_moi or not exists (select 1 from public.mesure_exclus x where x.appareil = e.appareil))
    ), premier as (
      -- première ouverture de chaque appareil, et la source de son premier lien
      select distinct on (appareil) appareil, jour, coalesce(nullif(props->>'src', ''), '') as src
      from ev where nom = 'ouverture' order by appareil, jour, id
    ), cohorte as (
      select p.appareil, p.src from premier p
      where p.jour >= d0
        -- vraiment nouveau : aucun événement avant cette première ouverture
        and not exists (select 1 from ev e where e.appareil = p.appareil and e.jour < p.jour)
    ), suivi as (
      select c.appareil, c.src,
             exists (select 1 from ev e where e.appareil = c.appareil and e.nom = 'plan_genere') as profil,
             exists (select 1 from ev e where e.appareil = c.appareil and e.nom = 'premiere_serie') as serie,
             (select count(*) from ev e where e.appareil = c.appareil and e.nom = 'seance_terminee') as seances
      from cohorte c
    )
    select jsonb_build_object(
      'etapes', (
        select jsonb_build_object(
          'ouverture', count(*),
          'profil', count(*) filter (where profil),
          'serie', count(*) filter (where serie),
          'seance', count(*) filter (where seances >= 1),
          'deux', count(*) filter (where seances >= 2))
        from suivi where p_src is null or src = p_src
      ),
      'sources', coalesce((
        select jsonb_agg(jsonb_build_object('source', src, 'n', n) order by n desc)
        from (select src, count(*) as n from suivi group by src) s
      ), '[]'::jsonb)
    )
  );
end;
$$;
revoke all on function public.admin_entonnoir(int, boolean, text) from public, anon;
grant execute on function public.admin_entonnoir(int, boolean, text) to authenticated;
