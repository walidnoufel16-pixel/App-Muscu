-- Défis entre amis : un défi (séances, tonnage ou minutes de cardio sur une période),
-- rejoint avec un code de cinq caractères. Aucun accès direct aux tables : tout passe
-- par des fonctions qui vérifient l'utilisateur connecté. Seul le score est envoyé,
-- jamais de donnée de santé.

create table public.defis (
  code   text primary key check (code ~ '^[A-HJ-NP-Z2-9]{5}$'),
  nom    text not null check (char_length(nom) between 1 and 60 and nom !~ '[<>]'),
  type   text not null check (type in ('seances', 'tonnage', 'cardio')),
  cible  integer not null check (cible between 1 and 10000000),
  debut  date not null,
  fin    date not null,
  auteur uuid not null references auth.users (id) on delete cascade,
  cree   timestamptz not null default now(),
  check (fin >= debut and fin - debut <= 92)
);
create index defis_auteur_idx on public.defis (auteur);

create table public.defis_participants (
  code    text not null references public.defis (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  pseudo  text not null check (char_length(pseudo) between 1 and 40 and pseudo !~ '[<>]'),
  score   integer not null default 0 check (score between 0 and 100000000),
  maj     timestamptz not null default now(),
  primary key (code, user_id)
);
create index defis_participants_user_idx on public.defis_participants (user_id);

alter table public.defis enable row level security;
alter table public.defis_participants enable row level security;
revoke all on public.defis, public.defis_participants from anon, authenticated;

-- Lecture d'un défi et de son classement (il faut connaître le code).
create function public.lire_defi(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'code', d.code, 'nom', d.nom, 'type', d.type, 'cible', d.cible, 'debut', d.debut, 'fin', d.fin,
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('pseudo', p.pseudo, 'score', p.score, 'moi', p.user_id = (select auth.uid()))
                       order by p.score desc, p.maj)
      from public.defis_participants p where p.code = d.code), '[]'::jsonb))
  from public.defis d
  where d.code = upper(p_code) and (select auth.uid()) is not null;
$$;

-- Création : l'auteur rejoint son défi. 10 défis en cours au plus par auteur.
create function public.creer_defi(p_code text, p_nom text, p_type text, p_cible integer, p_debut date, p_fin date, p_pseudo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moi uuid := (select auth.uid());
begin
  if v_moi is null then raise exception 'connexion requise'; end if;
  if p_debut < current_date - 1 or p_debut > current_date + 31 then raise exception 'date de début invalide'; end if;
  if (select count(*) from public.defis where auteur = v_moi and fin >= current_date) >= 10 then
    raise exception 'trop de défis en cours';
  end if;
  insert into public.defis (code, nom, type, cible, debut, fin, auteur)
    values (upper(p_code), p_nom, p_type, p_cible, p_debut, p_fin, v_moi);
  insert into public.defis_participants (code, user_id, pseudo) values (upper(p_code), v_moi, p_pseudo);
  return public.lire_defi(p_code);
end;
$$;

-- Rejoindre (ou changer de pseudo). 50 participants au plus.
create function public.rejoindre_defi(p_code text, p_pseudo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moi uuid := (select auth.uid());
begin
  if v_moi is null then raise exception 'connexion requise'; end if;
  if not exists (select 1 from public.defis where code = upper(p_code)) then return null; end if;
  if not exists (select 1 from public.defis_participants where code = upper(p_code) and user_id = v_moi)
     and (select count(*) from public.defis_participants where code = upper(p_code)) >= 50 then
    raise exception 'défi complet';
  end if;
  insert into public.defis_participants (code, user_id, pseudo) values (upper(p_code), v_moi, p_pseudo)
    on conflict (code, user_id) do update set pseudo = excluded.pseudo;
  return public.lire_defi(p_code);
end;
$$;

-- Score : seulement le sien, seulement pendant le défi (et le lendemain de la fin).
create function public.maj_score(p_code text, p_score integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.defis_participants p set score = p_score, maj = now()
  from public.defis d
  where p.code = upper(p_code) and d.code = p.code and p.user_id = (select auth.uid())
    and current_date between d.debut and d.fin + 1;
$$;

create function public.quitter_defi(p_code text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.defis_participants where code = upper(p_code) and user_id = (select auth.uid());
$$;

revoke all on function public.lire_defi(text), public.creer_defi(text, text, text, integer, date, date, text),
  public.rejoindre_defi(text, text), public.maj_score(text, integer), public.quitter_defi(text) from public, anon;
grant execute on function public.lire_defi(text), public.creer_defi(text, text, text, integer, date, date, text),
  public.rejoindre_defi(text, text), public.maj_score(text, integer), public.quitter_defi(text) to authenticated;
