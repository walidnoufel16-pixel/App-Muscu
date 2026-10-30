-- Rappels après quelques jours sans séance (notifications Web Push).
-- Un appareil qui accepte les notifications s'inscrit ici. La fonction Edge « rappels »
-- passe toutes les heures (pg_cron + pg_net) et n'envoie qu'à 18 h, heure de Paris.
-- Elle lit la date de la dernière séance dans etats : aucune nouvelle donnée personnelle.
-- Les clés (VAPID privée, clé d'appel du cron) sont dans le Vault, lisibles par le seul service_role.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create table public.rappels (
  endpoint   text primary key,            -- adresse de l'appareil chez Apple, Google ou Mozilla
  user_id    uuid not null references auth.users (id) on delete cascade,
  abonnement jsonb not null,              -- PushSubscription.toJSON()
  langue     text not null default 'fr',
  niveau     int not null default 0,      -- dernier rappel envoyé (1 à 3) depuis la dernière séance
  ref        date,                        -- dernière séance connue au moment de ce rappel
  envoye     timestamptz,
  cree       timestamptz not null default now()
);
create index rappels_user on public.rappels (user_id);
alter table public.rappels enable row level security;
revoke all on public.rappels from anon, authenticated;

-- S'inscrire (ou reprendre l'appareil après un changement de compte) : l'adresse de
-- l'appareil n'est connue que de lui.
create function public.rappels_abonner(p_abonnement jsonb, p_langue text default 'fr')
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
  if v_endpoint is null or v_endpoint !~ '^https://' or length(v_endpoint) > 1000 then raise exception 'abonnement invalide'; end if;
  insert into public.rappels (endpoint, user_id, abonnement, langue)
  values (v_endpoint, (select auth.uid()), p_abonnement, case when p_langue = 'en' then 'en' else 'fr' end)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, abonnement = excluded.abonnement, langue = excluded.langue,
        niveau = case when public.rappels.user_id = excluded.user_id then public.rappels.niveau else 0 end;
  return true;
end;
$$;

create function public.rappels_desabonner(p_endpoint text)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $$
  with d as (delete from public.rappels where endpoint = p_endpoint and user_id = (select auth.uid()) returning 1)
  select exists (select 1 from d);
$$;

revoke all on function public.rappels_abonner(jsonb, text), public.rappels_desabonner(text) from public, anon;
grant execute on function public.rappels_abonner(jsonb, text), public.rappels_desabonner(text) to authenticated;

-- Pour la fonction Edge seulement (service_role) : les abonnés avec leur sauvegarde, et les clés.
create function public.rappels_a_traiter()
returns table (endpoint text, user_id uuid, abonnement jsonb, langue text, niveau int, ref date, etat jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select r.endpoint, r.user_id, r.abonnement, r.langue, r.niveau, r.ref, coalesce(e.etat, '{}'::jsonb)
  from public.rappels r left join public.etats e on e.user_id = r.user_id;
$$;

create function public.rappels_cles()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_object_agg(name, decrypted_secret)
  from vault.decrypted_secrets where name in ('rappels_vapid_prive', 'rappels_vapid_public', 'rappels_cle');
$$;

revoke all on function public.rappels_a_traiter(), public.rappels_cles() from public, anon, authenticated;
grant execute on function public.rappels_a_traiter(), public.rappels_cles() to service_role;

-- Toutes les heures à la 2e minute ; la fonction ne fait rien hors de 18 h à Paris.
-- L'adresse est celle du projet de la vraie appli ; sur repere-staging (app test) : shhxawbybavlmayuyrky.
-- Les secrets du Vault : voir 20261030121000_rappels_cles_generees.sql.
select cron.schedule('rappels', '2 * * * *', $$
  select net.http_post(
    url := 'https://iyjiwfzrmyvcnmzwlgxe.supabase.co/functions/v1/rappels',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cle', (select decrypted_secret from vault.decrypted_secrets where name = 'rappels_cle')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000);
$$);
