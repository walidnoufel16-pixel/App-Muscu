-- Admin › Technique : erreurs marquées « analysée » par l'admin, avec une note.
-- Une erreur analysée ne déclenche plus de notification quand elle revient.
-- Script relançable sans erreur (if not exists, or replace).

create table if not exists public.erreurs_analyses (
  message text primary key,
  note    text not null default '',
  cree    timestamptz not null default now()
);
alter table public.erreurs_analyses enable row level security;
revoke all on public.erreurs_analyses from anon, authenticated;

create or replace function public.admin_analyses_erreurs()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('message', message, 'note', note, 'cree', cree) order by cree desc)
                   from public.erreurs_analyses), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_analyses_erreurs() from public, anon;
grant execute on function public.admin_analyses_erreurs() to authenticated;

-- note null : retire la marque
create or replace function public.admin_analyser_erreur(p_message text, p_note text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  if p_message is null or p_message = '' then return; end if;
  if p_note is null then
    delete from public.erreurs_analyses where message = p_message;
  else
    insert into public.erreurs_analyses (message, note) values (left(p_message, 300), left(p_note, 300))
      on conflict (message) do update set note = excluded.note, cree = now();
  end if;
end;
$$;
revoke all on function public.admin_analyser_erreur(text, text) from public, anon;
grant execute on function public.admin_analyser_erreur(text, text) to authenticated;

-- Notifications : une erreur déjà analysée est marquée signalée sans notification.
create or replace function public.erreurs_a_signaler()
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
  update public.erreurs r set signalee = true
    where not r.signalee and exists (select 1 from public.erreurs_analyses a where a.message = r.message);
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
