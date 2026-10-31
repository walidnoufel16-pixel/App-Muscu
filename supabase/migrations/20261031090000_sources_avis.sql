-- D'où viennent les nouveaux (liens ?src=tiktok, ?src=ami…) et ce qu'ils disent de l'app.
-- La source est notée par l'app à l'envoi de la sauvegarde ; les avis ne se lisent que dans Admin.

alter table public.etats add column source text check (source ~ '^[a-z0-9_-]{1,24}$');

create table public.avis (
  id      bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texte   text not null check (length(texte) between 1 and 1000),
  seances int,
  cree    timestamptz not null default now()
);
create index avis_cree on public.avis (cree desc);
alter table public.avis enable row level security;
revoke all on public.avis from anon, authenticated;
grant insert (texte, seances) on public.avis to authenticated;
create policy "donner son avis" on public.avis for insert to authenticated with check ((select auth.uid()) = user_id);

-- Tableau de bord : on ajoute les sources et les derniers avis à ce qui existait.
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return jsonb_build_object(
    'generations', coalesce((
      select jsonb_agg(jsonb_build_object('jour', jour, 'n', n, 'comptes', comptes) order by jour)
      from (select jour, sum(n)::int as n, count(*)::int as comptes from public.quotas_generation
            where jour > current_date - 30 group by jour) g), '[]'::jsonb),
    'cache', (select count(*) from public.plans_cache),
    'defis', coalesce((
      select jsonb_agg(jsonb_build_object('code', d.code, 'nom', d.nom, 'type', d.type, 'cible', d.cible,
                                          'debut', d.debut, 'fin', d.fin,
                                          'participants', (select count(*) from public.defis_participants p where p.code = d.code))
                       order by d.fin desc)
      from public.defis d), '[]'::jsonb),
    'partages', (select count(*) from public.seances_partagees),
    'partages_recents', coalesce((
      select jsonb_agg(jsonb_build_object('nom', s.nom, 'cree', s.cree) order by s.cree desc)
      from (select nom, cree from public.seances_partagees order by cree desc limit 20) s), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('source', source, 'comptes', comptes, 'actifs7', actifs7) order by comptes desc)
      from (select coalesce(e.source, '') as source, count(*)::int as comptes,
                   count(*) filter (where e.maj > now() - interval '7 days')::int as actifs7
            from public.etats e group by 1) s), '[]'::jsonb),
    'avis', coalesce((
      select jsonb_agg(jsonb_build_object('texte', a.texte, 'seances', a.seances, 'cree', a.cree, 'pseudo', e.pseudo) order by a.cree desc)
      from (select * from public.avis order by cree desc limit 50) a
      left join public.etats e on e.user_id = a.user_id), '[]'::jsonb));
end;
$$;
