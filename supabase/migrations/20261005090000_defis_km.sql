-- Défis entre amis : nouveau type « km » (kilomètres courus, préparation course à pied).
alter table public.defis drop constraint defis_type_check;
alter table public.defis add constraint defis_type_check check (type in ('seances', 'tonnage', 'cardio', 'km'));
