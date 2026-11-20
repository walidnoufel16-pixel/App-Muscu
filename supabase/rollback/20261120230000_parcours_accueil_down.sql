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
drop function if exists public.admin_parcours(int, boolean, text, text);
