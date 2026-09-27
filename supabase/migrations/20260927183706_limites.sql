-- Limites d'écriture : forme des séances partagées, taille de l'état, volume de publication.

-- Une séance partagée ne contient que des exercices bien formés,
-- sans aucun caractère capable d'ouvrir une balise HTML.
create function public.ex_valide(ex jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(ex) <> 'array' then false else
     jsonb_array_length(ex) between 1 and 12
     and not exists (
       select 1 from jsonb_array_elements(ex) e
       where jsonb_typeof(e) <> 'object'
          or coalesce(e->>'id', '') !~ '^[A-Za-z0-9]{1,20}$'
          or case when jsonb_typeof(e->'s') = 'number' then (e->>'s')::numeric not between 1 and 20 else true end
          or case when jsonb_typeof(e->'r') = 'number' then (e->>'r')::numeric not between 0 and 1000 else true end
          or case when e ? 'p' then jsonb_typeof(e->'p') <> 'string' or length(e->>'p') > 16 or e->>'p' ~ '[<>]' else false end
     ) end;
$$;

alter table public.seances_partagees
  add constraint seances_partagees_nom_sans_balise check (nom !~ '[<>]'),
  add constraint seances_partagees_ex_valide check (public.ex_valide(ex));

-- Un état raisonnable pèse quelques kilo-octets : 256 Ko laisse une marge énorme.
alter table public.etats
  add constraint etats_taille check (pg_column_size(etat) < 262144),
  add constraint etats_pseudo check (length(pseudo) <= 40 and pseudo !~ '[<>]');

-- Au plus 50 séances publiées par compte.
create function public.limite_partages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.seances_partagees where auteur = new.auteur) >= 50 then
    raise exception 'Limite de 50 séances partagées atteinte' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.limite_partages() from public, anon, authenticated;

create trigger seances_partagees_limite
  before insert on public.seances_partagees
  for each row execute function public.limite_partages();
