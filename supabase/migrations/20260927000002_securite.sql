-- Durcissement de sécurité et de performance.

-- 1. RLS : auth.uid() évalué une seule fois par requête, et réservé aux
--    utilisateurs connectés (les comptes anonymes Supabase ont le rôle authenticated).
alter policy "lire son etat"      on public.etats to authenticated using ((select auth.uid()) = user_id);
alter policy "creer son etat"     on public.etats to authenticated with check ((select auth.uid()) = user_id);
alter policy "modifier son etat"  on public.etats to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "supprimer son etat" on public.etats to authenticated using ((select auth.uid()) = user_id);
alter policy "publication par son auteur" on public.seances_partagees to authenticated with check ((select auth.uid()) = auteur);

-- 2. Séances partagées : plus de lecture de toute la table.
--    On ne lit une séance qu'en connaissant son code, via lire_seance().
drop policy "lecture publique" on public.seances_partagees;

create function public.lire_seance(p_code text)
returns table (nom text, ex jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select s.nom, s.ex from public.seances_partagees s where s.code = upper(p_code);
$$;
revoke all on function public.lire_seance(text) from public;
grant execute on function public.lire_seance(text) to anon, authenticated;

create index seances_partagees_auteur_idx on public.seances_partagees (auteur);

-- 3. Droits de table : le strict nécessaire pour les clients.
revoke all on public.plans_cache from anon, authenticated;
revoke all on public.etats from anon;
revoke all on public.seances_partagees from anon;
revoke truncate, references, trigger on public.etats, public.seances_partagees from authenticated;
revoke update, delete on public.seances_partagees from authenticated;

-- 4. Quotas de génération : chaque appel payant à l'IA est compté.
create table public.quotas_generation (
  user_id uuid not null references auth.users (id) on delete cascade,
  jour    date not null default current_date,
  n       integer not null default 0,
  primary key (user_id, jour)
);
alter table public.quotas_generation enable row level security;
revoke all on public.quotas_generation from anon, authenticated;

-- Renvoie true et consomme une unité si l'utilisateur ET le total du jour
-- sont sous leur plafond. Appelée uniquement par la fonction generer (service_role).
create function public.consommer_quota(p_user uuid, p_max_user integer, p_max_total integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user integer;
  v_total integer;
begin
  perform pg_advisory_xact_lock(hashtext('quotas_generation'));
  select coalesce(sum(n), 0) into v_total from public.quotas_generation where jour = current_date;
  select coalesce(max(n), 0) into v_user from public.quotas_generation where jour = current_date and user_id = p_user;
  if v_user >= p_max_user or v_total >= p_max_total then
    return false;
  end if;
  insert into public.quotas_generation as q (user_id, jour, n) values (p_user, current_date, 1)
    on conflict (user_id, jour) do update set n = q.n + 1;
  return true;
end;
$$;
revoke all on function public.consommer_quota(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.consommer_quota(uuid, integer, integer) to service_role;
