-- Retour arrière manuel de la migration securite (à n'utiliser qu'en cas de problème).
-- Rétablit exactement l'état du schéma initial. Non appliqué automatiquement.

drop function if exists public.consommer_quota(uuid, integer, integer);
drop table if exists public.quotas_generation;
drop index if exists public.seances_partagees_auteur_idx;
drop function if exists public.lire_seance(text);

create policy "lecture publique" on public.seances_partagees for select using (true);

alter policy "lire son etat"      on public.etats to public using (auth.uid() = user_id);
alter policy "creer son etat"     on public.etats to public with check (auth.uid() = user_id);
drop policy "modifier son etat" on public.etats;
create policy "modifier son etat" on public.etats for update using (auth.uid() = user_id);
alter policy "supprimer son etat" on public.etats to public using (auth.uid() = user_id);
alter policy "publication par son auteur" on public.seances_partagees to public with check (auth.uid() = auteur);

grant all on public.plans_cache, public.etats, public.seances_partagees to anon, authenticated;
