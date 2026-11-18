-- Alerte de l'admin à chaque nouvelle erreur du journal (notification Web Push).
-- Une erreur est « nouvelle » quand sa ligne est créée (message et version, par jour) : la même
-- erreur qui revient le même jour fait monter son compteur sans nouvelle notification.
-- Le déclencheur prévient la fonction Edge « rappels » (même clé que le cron, dans le Vault) ;
-- elle prend les erreurs pas encore signalées, les marque, et écrit aux appareils des admins.
-- L'adresse est celle du projet de la vraie appli (comme le cron des rappels).

alter table public.erreurs add column signalee boolean not null default false;
update public.erreurs set signalee = true;

create function public.erreurs_alerter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://iyjiwfzrmyvcnmzwlgxe.supabase.co/functions/v1/rappels',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cle', (select decrypted_secret from vault.decrypted_secrets where name = 'rappels_cle')),
    body := '{"alerte_erreurs": true}'::jsonb,
    timeout_milliseconds := 15000);
  return null;
end;
$$;
revoke all on function public.erreurs_alerter() from public, anon, authenticated;

-- après une vraie création seulement (un « on conflict do update » ne la déclenche pas)
create trigger erreurs_alerte after insert on public.erreurs
  for each row execute function public.erreurs_alerter();

-- Pour la fonction Edge : prend (et marque, d'un coup) les erreurs pas encore signalées, avec le
-- nombre déjà signalé aujourd'hui et les appareils des admins inscrits aux notifications.
create function public.erreurs_a_signaler()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  auj date := (now() at time zone 'Europe/Paris')::date;
  deja int;
  liste jsonb;
begin
  select count(*) into deja from public.erreurs where jour = auj and signalee;
  with prises as (
    update public.erreurs set signalee = true
    where not signalee and jour >= auj - 1
    returning message, page, navigateur, version, dernier
  )
  select coalesce(jsonb_agg(to_jsonb(p) order by p.dernier), '[]'::jsonb) into liste from prises p;
  return jsonb_build_object(
    'deja', deja,
    'erreurs', liste,
    'appareils', coalesce((
      select jsonb_agg(jsonb_build_object('endpoint', r.endpoint, 'abonnement', r.abonnement))
      from public.rappels r where r.user_id in (select user_id from public.admins)
    ), '[]'::jsonb));
end;
$$;
revoke all on function public.erreurs_a_signaler() from public, anon, authenticated;
grant execute on function public.erreurs_a_signaler() to service_role;
