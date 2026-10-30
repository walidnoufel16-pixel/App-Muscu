drop function if exists public.rappels_vapid_public();
drop function if exists public.rappels_enregistrer_vapid(text, text);
select cron.unschedule('rappels');
drop function if exists public.rappels_cles();
drop function if exists public.rappels_a_traiter();
drop function if exists public.rappels_desabonner(text);
drop function if exists public.rappels_abonner(jsonb, text);
drop table if exists public.rappels;
delete from vault.secrets where name in ('rappels_vapid_prive', 'rappels_vapid_public', 'rappels_cle');
