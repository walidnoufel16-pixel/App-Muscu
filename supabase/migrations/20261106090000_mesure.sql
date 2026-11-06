-- Mesure anonyme de l'usage et des erreurs, sans service tiers.
-- Aucune donnée personnelle : un identifiant d'appareil tiré au hasard sur le téléphone (jamais lié
-- au compte ni à l'e-mail), le jour, un nom d'événement pris dans une liste fermée. Écriture par deux
-- fonctions bornées (taille, nombre par appareil et par jour) ; aucune lecture depuis l'app, sauf
-- l'admin, qui ne reçoit que des agrégats. Purge : événements 13 mois, erreurs 90 jours.

create table public.evenements (
  id       bigint generated always as identity primary key,
  jour     date not null default ((now() at time zone 'Europe/Paris')::date),
  appareil text not null check (appareil ~ '^[a-z0-9]{8,32}$'),
  nom      text not null check (nom in ('ouverture', 'premiere_serie', 'seance_terminee', 'seance_arretee',
                                        'rubrique_ouverte', 'plan_genere', 'repas_note', 'visite_finie')),
  props    jsonb check (props is null or (jsonb_typeof(props) = 'object' and length(props::text) <= 200)),
  cree     timestamptz not null default now()
);
create index evenements_jour on public.evenements (jour);
create index evenements_appareil on public.evenements (appareil, jour);
create index evenements_nom on public.evenements (nom, jour);
alter table public.evenements enable row level security;
revoke all on public.evenements from anon, authenticated;

create table public.erreurs (
  empreinte  text not null,
  jour       date not null default ((now() at time zone 'Europe/Paris')::date),
  version    text not null default '',
  page       text not null default '',
  message    text not null,
  pile       text not null default '',
  navigateur text not null default '',
  n          int not null default 1,
  dernier    timestamptz not null default now(),
  primary key (empreinte, jour)
);
create index erreurs_jour on public.erreurs (jour);
alter table public.erreurs enable row level security;
revoke all on public.erreurs from anon, authenticated;

-- Plafonds par appareil et par jour (200 événements, 50 erreurs).
create table public.mesure_quota (
  appareil text not null,
  jour     date not null,
  ev       int not null default 0,
  er       int not null default 0,
  primary key (appareil, jour)
);
alter table public.mesure_quota enable row level security;
revoke all on public.mesure_quota from anon, authenticated;

create function public.noter_evenements(p_appareil text, p_evenements jsonb)
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
  insert into public.mesure_quota as q (appareil, jour, ev) values (p_appareil, auj, n)
    on conflict (appareil, jour) do update set ev = q.ev + excluded.ev
    returning q.ev into pris;
  if pris > 200 then return 0; end if;
  insert into public.evenements (appareil, nom, props, jour)
  select p_appareil, e->>'nom',
         case when jsonb_typeof(e->'props') = 'object' and length((e->'props')::text) <= 200 then e->'props' end,
         -- un événement gardé hors ligne garde son jour, dans la limite de 7 jours en arrière
         case when (e->>'jour') ~ '^\d{4}-\d{2}-\d{2}$' and (e->>'jour')::date between auj - 7 and auj then (e->>'jour')::date else auj end
  from (select value as e from jsonb_array_elements(p_evenements) limit 50) x
  where e->>'nom' in ('ouverture', 'premiere_serie', 'seance_terminee', 'seance_arretee',
                      'rubrique_ouverte', 'plan_genere', 'repas_note', 'visite_finie');
  get diagnostics n = row_count;
  -- purge de temps en temps, sans tâche planifiée
  if random() < 0.01 then
    delete from public.evenements where jour < auj - 395;
    delete from public.erreurs where jour < auj - 90;
    delete from public.mesure_quota where jour < auj - 2;
  end if;
  return n;
end;
$$;

create function public.noter_erreur(p_appareil text, p_message text, p_pile text, p_page text, p_version text, p_navigateur text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  auj date := (now() at time zone 'Europe/Paris')::date;
  pris int;
  m text := left(coalesce(p_message, ''), 300);
  v text := left(coalesce(p_version, ''), 24);
begin
  if p_appareil is null or p_appareil !~ '^[a-z0-9]{8,32}$' or m = '' then return; end if;
  insert into public.mesure_quota as q (appareil, jour, er) values (p_appareil, auj, 1)
    on conflict (appareil, jour) do update set er = q.er + 1
    returning q.er into pris;
  if pris > 50 then return; end if;
  insert into public.erreurs as r (empreinte, jour, version, page, message, pile, navigateur)
  values (md5(m || '|' || v), auj, v, left(coalesce(p_page, ''), 120), m, left(coalesce(p_pile, ''), 1500), left(coalesce(p_navigateur, ''), 160))
  on conflict (empreinte, jour) do update
    set n = r.n + 1, dernier = now();
end;
$$;

revoke all on function public.noter_evenements(text, jsonb) from public;
revoke all on function public.noter_erreur(text, text, text, text, text, text) from public;
grant execute on function public.noter_evenements(text, jsonb) to anon, authenticated;
grant execute on function public.noter_erreur(text, text, text, text, text, text) to anon, authenticated;

-- Agrégats pour l'écran Admin › Mesure.
create function public.admin_mesure()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  auj date := (now() at time zone 'Europe/Paris')::date;
begin
  perform public.exiger_admin();
  return jsonb_build_object(
    'actifs', jsonb_build_object(
      'j1',  (select count(distinct appareil) from public.evenements where jour = auj),
      'j7',  (select count(distinct appareil) from public.evenements where jour > auj - 7),
      'j30', (select count(distinct appareil) from public.evenements where jour > auj - 30)
    ),
    -- cohortes par semaine de première apparition (12 dernières semaines)
    'cohortes', coalesce((
      with premier as (
        select appareil, min(jour) as d from public.evenements group by appareil
      ), c as (
        select date_trunc('week', p.d)::date as semaine, p.appareil, p.d,
               exists (select 1 from public.evenements e where e.appareil = p.appareil and e.nom = 'premiere_serie' and e.jour <= p.d + 1) as active,
               exists (select 1 from public.evenements e where e.appareil = p.appareil and e.jour >= p.d + 7) as j7,
               exists (select 1 from public.evenements e where e.appareil = p.appareil and e.jour >= p.d + 30) as j30
        from premier p where p.d > auj - 84
      )
      select jsonb_agg(jsonb_build_object(
               'semaine', semaine, 'nouveaux', nouveaux, 'actives', actives,
               'j7', case when semaine + 13 <= auj then j7 end,
               'j30', case when semaine + 36 <= auj then j30 end) order by semaine desc)
      from (select semaine, count(*) as nouveaux, count(*) filter (where active) as actives,
                   count(*) filter (where j7) as j7, count(*) filter (where j30) as j30
            from c group by semaine) s
    ), '[]'::jsonb),
    -- séances terminées par semaine (8 dernières semaines)
    'seances', coalesce((
      select jsonb_agg(jsonb_build_object('semaine', semaine, 'seances', n, 'appareils', a, 'arretees', ar) order by semaine desc)
      from (select date_trunc('week', jour)::date as semaine,
                   count(*) filter (where nom = 'seance_terminee') as n,
                   count(distinct appareil) filter (where nom = 'seance_terminee') as a,
                   count(*) filter (where nom = 'seance_arretee') as ar
            from public.evenements where jour > auj - 56 and nom in ('seance_terminee', 'seance_arretee')
            group by 1) s
    ), '[]'::jsonb),
    -- rubriques ouvertes sur 30 jours
    'rubriques', coalesce((
      select jsonb_agg(jsonb_build_object('rubrique', r, 'ouvertures', n, 'appareils', a) order by a desc)
      from (select coalesce(props->>'r', '?') as r, count(*) as n, count(distinct appareil) as a
            from public.evenements where nom = 'rubrique_ouverte' and jour > auj - 30 group by 1) s
    ), '[]'::jsonb),
    -- autres actions sur 30 jours
    'actions', coalesce((
      select jsonb_object_agg(nom, n) from (
        select nom, count(*) as n from public.evenements
        where jour > auj - 30 and nom in ('plan_genere', 'repas_note', 'visite_finie', 'premiere_serie') group by nom) s
    ), '{}'::jsonb),
    -- erreurs des 14 derniers jours, les plus fréquentes
    'erreurs', coalesce((
      select jsonb_agg(x order by (x->>'n')::int desc) from (
        select jsonb_build_object('message', message, 'page', max(page), 'version', version, 'navigateur', max(navigateur),
                                  'pile', max(pile), 'n', sum(n), 'jours', count(*), 'dernier', max(dernier)) as x
        from public.erreurs where jour > auj - 14
        group by message, version order by sum(n) desc limit 20) s
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_mesure() from public, anon;
grant execute on function public.admin_mesure() to authenticated;
