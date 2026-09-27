-- Retour arrière manuel de la migration limites (à n'utiliser qu'en cas de problème).

drop trigger if exists seances_partagees_limite on public.seances_partagees;
drop function if exists public.limite_partages();
alter table public.etats
  drop constraint if exists etats_taille,
  drop constraint if exists etats_pseudo;
alter table public.seances_partagees
  drop constraint if exists seances_partagees_nom_sans_balise,
  drop constraint if exists seances_partagees_ex_valide;
drop function if exists public.ex_valide(jsonb);
