-- Nouveaux testeurs : un compte dont l'adresse vient d'être confirmée.
-- Chaque nouveau testeur est noté dans public.testeurs (une seule fois) et la fonction Edge
-- « rappels » prévient les admins (notification Web Push), comme pour les erreurs.
-- `bienvenue` servira à l'e-mail de bienvenue (testeurs confirmés à partir du 18/11/2026, 12 h à Paris).

create table public.testeurs (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  confirme   timestamptz not null default now(),
  signale    boolean not null default false,
  bienvenue  boolean not null default false
);
alter table public.testeurs enable row level security;
revoke all on public.testeurs from anon, authenticated;

-- les comptes déjà là : ni notification ni e-mail
insert into public.testeurs (user_id, confirme, signale, bienvenue)
select id, coalesce(email_confirmed_at, created_at), true, true from auth.users
where email_confirmed_at is not null;

create function public.testeur_nouveau()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then return null; end if;
  insert into public.testeurs (user_id, confirme) values (new.id, new.email_confirmed_at)
    on conflict (user_id) do nothing;
  if not found then return null; end if;
  perform net.http_post(
    url := 'https://iyjiwfzrmyvcnmzwlgxe.supabase.co/functions/v1/rappels',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cle', (select decrypted_secret from vault.decrypted_secrets where name = 'rappels_cle')),
    body := '{"nouveau_testeur": true}'::jsonb,
    timeout_milliseconds := 15000);
  return null;
end;
$$;
revoke all on function public.testeur_nouveau() from public, anon, authenticated;

create trigger testeur_nouveau_insert after insert on auth.users
  for each row execute function public.testeur_nouveau();
create trigger testeur_nouveau_confirme after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.testeur_nouveau();

-- Pour la fonction Edge : prend (et marque) les testeurs pas encore signalés, le total, et les
-- appareils des admins inscrits aux notifications.
create function public.testeurs_a_signaler()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n int;
begin
  with pris as (update public.testeurs set signale = true where not signale returning 1)
  select count(*) into n from pris;
  return jsonb_build_object(
    'nouveaux', n,
    'total', (select count(*) from public.testeurs),
    'appareils', coalesce((
      select jsonb_agg(jsonb_build_object('endpoint', r.endpoint, 'abonnement', r.abonnement))
      from public.rappels r where r.user_id in (select user_id from public.admins)
    ), '[]'::jsonb));
end;
$$;
revoke all on function public.testeurs_a_signaler() from public, anon, authenticated;
grant execute on function public.testeurs_a_signaler() to service_role;
