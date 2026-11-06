-- Admin › Mesure : d'où viennent les visiteurs (avec ou sans compte).
-- L'app ajoute la source du premier lien (?src=tiktok, instagram, youtube…) à l'événement
-- « ouverture » ; admin_mesure() gagne l'agrégat « sources ». Rien d'autre ne change.

create or replace function public.admin_mesure()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  auj date := (now() at time zone 'Europe/Paris')::date;
begin
  perform public.exiger_admin();
  return jsonb_build_object(
    'actifs', jsonb_build_object(
      'j1',  (select count(distinct appareil) from public.evenements where jour = auj),
      'j7',  (select count(distinct appareil) from public.evenements where jour > auj - 7),
      'j30', (select count(distinct appareil) from public.evenements where jour > auj - 30)
    ),
    -- cohortes par semaine de première apparition (12 dernières semaines)
    'cohortes', coalesce((
      with premier as (
        select appareil, min(jour) as d from public.evenements group by appareil
      ), c as (
        select date_trunc('week', p.d)::date as semaine, p.appareil, p.d,
               exists (select 1 from public.evenements e where e.appareil = p.appareil and e.nom = 'premiere_serie' and e.jour <= p.d + 1) as active,
               exists (select 1 from public.evenements e where e.appareil = p.appareil and e.jour >= p.d + 7) as j7,
               exists (select 1 from public.evenements e where e.appareil = p.appareil and e.jour >= p.d + 30) as j30
        from premier p where p.d > auj - 84
      )
      select jsonb_agg(jsonb_build_object(
               'semaine', semaine, 'nouveaux', nouveaux, 'actives', actives,
               'j7', case when semaine + 13 <= auj then j7 end,
               'j30', case when semaine + 36 <= auj then j30 end) order by semaine desc)
      from (select semaine, count(*) as nouveaux, count(*) filter (where active) as actives,
                   count(*) filter (where j7) as j7, count(*) filter (where j30) as j30
            from c group by semaine) s
    ), '[]'::jsonb),
    -- séances terminées par semaine (8 dernières semaines)
    'seances', coalesce((
      select jsonb_agg(jsonb_build_object('semaine', semaine, 'seances', n, 'appareils', a, 'arretees', ar) order by semaine desc)
      from (select date_trunc('week', jour)::date as semaine,
                   count(*) filter (where nom = 'seance_terminee') as n,
                   count(distinct appareil) filter (where nom = 'seance_terminee') as a,
                   count(*) filter (where nom = 'seance_arretee') as ar
            from public.evenements where jour > auj - 56 and nom in ('seance_terminee', 'seance_arretee')
            group by 1) s
    ), '[]'::jsonb),
    -- rubriques ouvertes sur 30 jours
    'rubriques', coalesce((
      select jsonb_agg(jsonb_build_object('rubrique', r, 'ouvertures', n, 'appareils', a) order by a desc)
      from (select coalesce(props->>'r', '?') as r, count(*) as n, count(distinct appareil) as a
            from public.evenements where nom = 'rubrique_ouverte' and jour > auj - 30 group by 1) s
    ), '[]'::jsonb),
    -- autres actions sur 30 jours
    'actions', coalesce((
      select jsonb_object_agg(nom, n) from (
        select nom, count(*) as n from public.evenements
        where jour > auj - 30 and nom in ('plan_genere', 'repas_note', 'visite_finie', 'premiere_serie') group by nom) s
    ), '{}'::jsonb),
    -- d'où viennent les appareils apparus sur 30 jours : la source de leur première ouverture
    -- (?src= du lien), et combien ont fait une première série
    'sources', coalesce((
      with premier as (
        select distinct on (appareil) appareil, jour, coalesce(nullif(props->>'src', ''), '') as src
        from public.evenements where nom = 'ouverture' and jour > auj - 30
        order by appareil, jour, id
      ), nouveaux as (
        select p.* from premier p
        where not exists (select 1 from public.evenements e where e.appareil = p.appareil and e.jour < p.jour)
      )
      select jsonb_agg(jsonb_build_object('source', src, 'appareils', a, 'actives', ac) order by a desc)
      from (select n.src, count(*) as a,
                   count(*) filter (where exists (select 1 from public.evenements e where e.appareil = n.appareil and e.nom = 'premiere_serie')) as ac
            from nouveaux n group by n.src) s
    ), '[]'::jsonb),
    -- erreurs des 14 derniers jours, les plus fréquentes
    'erreurs', coalesce((
      select jsonb_agg(x order by (x->>'n')::int desc) from (
        select jsonb_build_object('message', message, 'page', max(page), 'version', version, 'navigateur', max(navigateur),
                                  'pile', max(pile), 'n', sum(n), 'jours', count(*), 'dernier', max(dernier)) as x
        from public.erreurs where jour > auj - 14
        group by message, version order by sum(n) desc limit 20) s
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_mesure() from public, anon;
grant execute on function public.admin_mesure() to authenticated;
