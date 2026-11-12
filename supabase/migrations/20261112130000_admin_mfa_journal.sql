-- Audit de sécurité du 12 novembre 2026 : espace admin.
-- 1. Double authentification : dès que le compte admin a un facteur MFA vérifié (TOTP), toute
--    action admin exige une session de niveau aal2. Tant qu'aucun facteur n'est enrôlé, rien ne
--    change (pas de verrouillage) : enrôler le facteur dans Supabase › Authentication › MFA,
--    puis se reconnecter avec le code.
-- 2. Chaque lecture d'une fiche (admin_etat) est notée dans admin_journal.

create or replace function public.exiger_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = (select auth.uid())) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if exists (select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status = 'verified')
     and coalesce((select auth.jwt() ->> 'aal'), '') <> 'aal2' then
    raise exception 'Double authentification requise' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.admin_etat(p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  -- chaque consultation d'une fiche est tracée (qui a lu quoi, quand)
  insert into public.admin_journal (admin, action, compte, pseudo, email)
  select (select auth.uid()), 'lecture', u.id, e.pseudo, u.email
  from auth.users u left join public.etats e on e.user_id = u.id where u.id = p_user;
  return (
    select jsonb_build_object(
      'id', u.id, 'email', u.email, 'anonyme', coalesce(u.is_anonymous, false),
      'cree', u.created_at, 'connexion', u.last_sign_in_at,
      'pseudo', e.pseudo, 'maj', e.maj, 'etat', coalesce(e.etat, '{}'::jsonb),
      'programme', exists (select 1 from public.acces_programme a where a.user_id = u.id),
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
