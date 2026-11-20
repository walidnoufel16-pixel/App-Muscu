-- Annule 20261120230000_parcours_accueil.sql : retire les deux événements (et leurs lignes) et rétablit
-- l'entonnoir précédent (20261120210000_seance_programmee.sql).
delete from public.evenements where nom in ('chemin_choisi', 'seance_prete');
alter table public.evenements drop constraint if exists evenements_nom_check;
alter table public.evenements add constraint evenements_nom_check check (nom in ('ouverture', 'premiere_serie', 'seance_terminee', 'seance_arretee', 'rubrique_ouverte', 'plan_genere', 'repas_note', 'visite_finie', 'seance_programmee'));
create or replace function public.noter_evenements(p_appareil text, p_evenements jsonb)
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  auj date := (now() at time zone 'Europe/Paris')::date;
  n int;
  pris int;
begin
  if p_appareil is null or p_appareil !~ '^[a-z0-9]{8,32}$' or jsonb_typeof(p_evenements) <> 'array' then return 0; end if;
  n := least(jsonb_array_length(p_evenements), 50);
  if n = 0 then return 0; end if;
  -- plafond global : un script qui change d'identifiant à chaque appel ne remplit plus le disque
  if (select count(*) from public.evenements where jour = auj) >= 50000 then return 0; end if;
  insert into public.mesure_quota as q (appareil, jour, ev) values (p_appareil, auj, n)
    on conflict (appareil, jour) do update set ev = q.ev + excluded.ev
    returning q.ev into pris;
  if pris > 200 then return 0; end if;
  insert into public.evenements (appareil, nom, props, jour)
  select p_appareil, e->>'nom',
         case when jsonb_typeof(e->'props') = 'object' and length((e->'props')::text) <= 200 then e->'props' end,
         case when (e->>'jour') ~ '^\d{4}-\d{2}-\d{2}$' and (e->>'jour')::date between auj - 7 and auj then (e->>'jour')::date else auj end
  from (select value as e from jsonb_array_elements(p_evenements) limit 50) x
  where e->>'nom' in ('ouverture', 'premiere_serie', 'seance_terminee', 'seance_arretee', 'rubrique_ouverte', 'plan_genere', 'repas_note', 'visite_finie', 'seance_programmee');
  get diagnostics n = row_count;
  return n;
end;
$$;
drop function if exists public.admin_entonnoir(int, boolean, text, text);
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
             exists (select 1 from ev e where e.appareil = c.appareil and e.nom = 'seance_programmee') as programme,
             exists (select 1 from ev e where e.appareil = c.appareil and e.nom = 'premiere_serie') as serie,
             (select count(*) from ev e where e.appareil = c.appareil and e.nom = 'seance_terminee') as seances
      from cohorte c
    )
    select jsonb_build_object(
      'etapes', (
        select jsonb_build_object(
          'ouverture', count(*),
          'profil', count(*) filter (where profil),
          'programme', count(*) filter (where programme),
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
