-- Retour en arrière : réappliquer admin_stats() de 20261006090000_admin.sql, puis :
drop table if exists public.avis;
alter table public.etats drop column if exists source;
