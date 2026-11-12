-- Audit de sécurité du 12 novembre 2026.
-- 1. Rappels : seules les adresses des vrais services de notification (Google, Mozilla, Apple,
--    Microsoft) sont acceptées, 5 appareils au plus par compte. Avant, n'importe quelle adresse
--    https:// passait, en nombre illimité : le projet pouvait servir à bombarder un site tiers,
--    et le cron horaire à charger des milliers de fois le même état.
-- 2. rappels_a_traiter() ne renvoie plus que les champs de l'état utiles aux rappels.
-- 3. Mesure : un plafond global par jour, en plus du plafond par appareil (que l'appelant
--    choisit lui-même), et une purge planifiée au lieu d'une purge au hasard.

-- ---------- 1. rappels ----------
create or replace function public.rappels_endpoint_valide(p_endpoint text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_endpoint is not null and length(p_endpoint) <= 1000
     and p_endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/';
$$;
revoke all on function public.rappels_endpoint_valide(text) from public, anon, authenticated;

create or replace function public.rappels_abonner(p_abonnement jsonb, p_langue text default 'fr')
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_endpoint text := p_abonnement ->> 'endpoint';
begin
  if (select auth.uid()) is null then raise exception 'connexion requise'; end if;
  if not public.rappels_endpoint_valide(v_endpoint)
     or coalesce(length(p_abonnement #>> '{keys,p256dh}'), 0) not between 60 and 120
     or coalesce(length(p_abonnement #>> '{keys,auth}'), 0) not between 16 and 40 then
    raise exception 'abonnement invalide';
  end if;
  if (select count(*) from public.rappels
      where user_id = (select auth.uid()) and endpoint <> v_endpoint) >= 5 then
    raise exception 'trop d''appareils';
  end if;
  insert into public.rappels (endpoint, user_id, abonnement, langue)
  values (v_endpoint, (select auth.uid()), p_abonnement, case when p_langue = 'en' then 'en' else 'fr' end)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, abonnement = excluded.abonnement, langue = excluded.langue,
        niveau = case when public.rappels.user_id = excluded.user_id then public.rappels.niveau else 0 end;
  return true;
end;
$$;

-- Les inscriptions déjà faites vers une autre adresse ne sont pas de vrais appareils.
delete from public.rappels where not public.rappels_endpoint_valide(endpoint);
-- Au-delà de 5 appareils par compte : on garde les 5 plus récents.
delete from public.rappels r
using (select endpoint, row_number() over (partition by user_id order by cree desc) as rang from public.rappels) x
where r.endpoint = x.endpoint and x.rang > 5;

-- Seuls les champs lus par la fonction Edge (logique.ts) quittent la base.
create or replace function public.rappels_a_traiter()
returns table (endpoint text, user_id uuid, abonnement jsonb, langue text, niveau int, ref date, etat jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select r.endpoint, r.user_id, r.abonnement, r.langue, r.niveau, r.ref,
         coalesce(jsonb_strip_nulls(jsonb_build_object(
           'HIST', e.etat -> 'HIST', 'CARDIO', e.etat -> 'CARDIO', 'SORTIES', e.etat -> 'SORTIES',
           'SEANCES', e.etat -> 'SEANCES', 'AGENDA', e.etat -> 'AGENDA')), '{}'::jsonb)
  from public.rappels r left join public.etats e on e.user_id = r.user_id;
$$;

-- ---------- 3. mesure ----------
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
  where e->>'nom' in ('ouverture', 'premiere_serie', 'seance_terminee', 'seance_arretee',
                      'rubrique_ouverte', 'plan_genere', 'repas_note', 'visite_finie');
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.noter_erreur(p_appareil text, p_message text, p_pile text, p_page text, p_version text, p_navigateur text)
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
  if (select count(*) from public.erreurs where jour = auj) >= 2000 then return; end if;
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

-- Purge chaque nuit à 3 h 17 (heure du serveur), à la place de la purge au hasard.
select cron.schedule('purge_mesure', '17 3 * * *', $$
  delete from public.evenements where jour < current_date - 395;
  delete from public.erreurs where jour < current_date - 90;
  delete from public.mesure_quota where jour < current_date - 2;
$$);
