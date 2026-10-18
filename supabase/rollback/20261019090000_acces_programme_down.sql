-- Retour arrière manuel de la migration acces_programme : la liste et la fiche admin
-- reprennent leur version précédente (sans le champ « programme »), puis tout le reste disparaît.
create or replace function public.admin_utilisateurs()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', u.id, 'email', u.email, 'anonyme', coalesce(u.is_anonymous, false),
      'cree', u.created_at, 'connexion', u.last_sign_in_at,
      'pseudo', e.pseudo, 'maj', e.maj, 'etat', coalesce(e.etat, '{}'::jsonb))
      order by coalesce(e.maj, u.created_at) desc)
    from auth.users u
    left join public.etats e on e.user_id = u.id), '[]'::jsonb);
end;
$$;

create or replace function public.admin_etat(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return (
    select jsonb_build_object(
      'id', u.id, 'email', u.email, 'anonyme', coalesce(u.is_anonymous, false),
      'cree', u.created_at, 'connexion', u.last_sign_in_at,
      'pseudo', e.pseudo, 'maj', e.maj, 'etat', coalesce(e.etat, '{}'::jsonb),
      'defis', coalesce((
        select jsonb_agg(jsonb_build_object('code', d.code, 'nom', d.nom, 'type', d.type, 'cible', d.cible,
                                            'debut', d.debut, 'fin', d.fin, 'score', p.score) order by d.fin desc)
        from public.defis_participants p join public.defis d on d.code = p.code
        where p.user_id = u.id), '[]'::jsonb),
      'generations', coalesce((
        select jsonb_agg(jsonb_build_object('jour', q.jour, 'n', q.n) order by q.jour desc)
        from public.quotas_generation q where q.user_id = u.id), '[]'::jsonb))
    from auth.users u
    left join public.etats e on e.user_id = u.id
    where u.id = p_user);
end;
$$;

drop function if exists public.admin_acces_programme(uuid, boolean);
drop function if exists public.programme_autorise();
drop table if exists public.acces_programme;
