-- Suivi des visiteurs (27/11/2026), même sans compte : toujours anonyme (identifiant d'appareil tiré
-- au hasard, jamais lié au compte). Trois nouveaux événements :
--   ecran       un écran quitté : props p (adresse sans paramètres, ou étape de Bienvenue comme
--               /bienvenue/compte), s (secondes passées), dfl (défilement atteint, en %) ;
--   clic        un bouton ou un lien touché : props p (écran) et l (son libellé, jamais une saisie) ;
--   compte_cree le compte vient d'être créé : props mail (une adresse donnée ou non).
-- Chaque événement porte aussi t (heure exacte, en secondes) ; l'ouverture du jour porte la provenance
-- (src, ref = site d'origine), l'appareil (dev), l'app installée (app), la langue (lang), nouveau.
-- Quota par appareil et par jour : 400 événements (200 avant ; les écrans et les clics en ajoutent).
-- Deux lectures réservées à l'admin : admin_visiteurs (un résumé par appareil) et admin_visiteur
-- (le parcours complet d'un appareil). Mêmes règles que l'entonnoir : à partir du 18/11/2026, sans les
-- appareils de l'admin (sauf demande). Script relançable sans erreur.

alter table public.evenements drop constraint if exists evenements_nom_check;
alter table public.evenements add constraint evenements_nom_check check (nom in ('ouverture', 'premiere_serie', 'seance_terminee', 'seance_arretee', 'rubrique_ouverte', 'plan_genere', 'repas_note', 'visite_finie', 'seance_programmee', 'chemin_choisi', 'seance_prete', 'ecran', 'clic', 'compte_cree'));

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
  if pris > 400 then return 0; end if;
  insert into public.evenements (appareil, nom, props, jour)
  select p_appareil, e->>'nom',
         case when jsonb_typeof(e->'props') = 'object' and length((e->'props')::text) <= 200 then e->'props' end,
         case when (e->>'jour') ~ '^\d{4}-\d{2}-\d{2}$' and (e->>'jour')::date between auj - 7 and auj then (e->>'jour')::date else auj end
  from (select value as e from jsonb_array_elements(p_evenements) limit 50) x
  where e->>'nom' in ('ouverture', 'premiere_serie', 'seance_terminee', 'seance_arretee', 'rubrique_ouverte', 'plan_genere', 'repas_note', 'visite_finie', 'seance_programmee', 'chemin_choisi', 'seance_prete', 'ecran', 'clic', 'compte_cree');
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.admin_visiteurs(p_jours int, p_avec_moi boolean default false)
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
  return coalesce((
    with ev as (
      select e.*, coalesce(case when e.props->>'t' ~ '^[0-9]{9,11}$' then to_timestamp((e.props->>'t')::bigint) end, e.cree) as h
      from public.evenements e
      where e.cree >= debut and e.jour >= d0
        and (p_avec_moi or not exists (select 1 from public.mesure_exclus x where x.appareil = e.appareil))
    ), par as (
      select appareil,
             min(h) as premier, max(h) as dernier, count(distinct jour) as jours,
             count(*) filter (where nom = 'ecran') as ecrans,
             coalesce(sum((props->>'s')::int) filter (where nom = 'ecran' and props->>'s' ~ '^[0-9]+$'), 0) as temps,
             count(*) filter (where nom = 'clic') as clics,
             bool_or(nom = 'ecran' and props->>'p' = '/bienvenue/compte') as formulaire,
             bool_or(nom = 'compte_cree') as compte,
             bool_or(nom = 'seance_prete') as prete,
             bool_or(nom = 'premiere_serie') as serie,
             count(*) filter (where nom = 'seance_terminee') as seances
      from ev group by appareil
    )
    select jsonb_agg(jsonb_build_object(
      'appareil', p.appareil, 'premier', p.premier, 'dernier', p.dernier, 'jours', p.jours,
      'ecrans', p.ecrans, 'temps', p.temps, 'clics', p.clics,
      'formulaire', p.formulaire, 'compte', p.compte, 'prete', p.prete, 'serie', p.serie, 'seances', p.seances,
      'ouverture', (select e.props from ev e where e.appareil = p.appareil and e.nom = 'ouverture' order by e.h, e.id limit 1),
      'dernier_ecran', (select e.props->>'p' from ev e where e.appareil = p.appareil and e.nom = 'ecran' order by e.h desc, e.id desc limit 1)
    ) order by p.dernier desc)
    from (select * from par order by dernier desc limit 300) p
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_visiteurs(int, boolean) from public, anon;
grant execute on function public.admin_visiteurs(int, boolean) to authenticated;

create or replace function public.admin_visiteur(p_appareil text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  if p_appareil is null or p_appareil !~ '^[a-z0-9]{8,32}$' then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('nom', x.nom, 'props', x.props, 'h', x.h) order by x.h, x.id)
    from (
      select e.id, e.nom, e.props, coalesce(case when e.props->>'t' ~ '^[0-9]{9,11}$' then to_timestamp((e.props->>'t')::bigint) end, e.cree) as h
      from public.evenements e
      where e.appareil = p_appareil and e.cree >= '2026-11-18T00:00:00Z'
      order by h desc, e.id desc
      limit 1500
    ) x
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_visiteur(text) from public, anon;
grant execute on function public.admin_visiteur(text) to authenticated;
