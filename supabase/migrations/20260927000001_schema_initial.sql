-- Schéma initial de Repère, reconstitué à l'identique depuis la production
-- (créé à la main dans le tableau de bord avant le versionnage).
-- En production, cette migration est marquée comme déjà appliquée : ne pas la rejouer.

-- État complet de l'app, un document JSON par utilisateur
create table public.etats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pseudo  text not null,
  etat    jsonb not null default '{}'::jsonb,
  maj     timestamptz not null default now()
);
alter table public.etats enable row level security;

create policy "lire son etat"      on public.etats for select using (auth.uid() = user_id);
create policy "creer son etat"     on public.etats for insert with check (auth.uid() = user_id);
create policy "modifier son etat"  on public.etats for update using (auth.uid() = user_id);
create policy "supprimer son etat" on public.etats for delete using (auth.uid() = user_id);

-- Séances partagées par code
create table public.seances_partagees (
  code   text primary key,
  nom    text not null check (length(nom) <= 60),
  ex     jsonb not null check (jsonb_array_length(ex) >= 1 and jsonb_array_length(ex) <= 12),
  auteur uuid references auth.users (id) on delete set null,
  cree   timestamptz default now()
);
alter table public.seances_partagees enable row level security;

create policy "lecture publique"           on public.seances_partagees for select using (true);
create policy "publication par son auteur" on public.seances_partagees for insert with check (auth.uid() = auteur);

-- Cache des plans générés par la fonction generer (accès service_role uniquement)
create table public.plans_cache (
  signature text primary key,
  plan      jsonb not null,
  cree      timestamptz default now()
);
alter table public.plans_cache enable row level security;
