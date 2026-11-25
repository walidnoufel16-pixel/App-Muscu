-- Mode Guidé (docs/produit/mode-suivi) : les nouveaux comptes n'ont que le mode Suivi ; l'admin
-- ouvre le mode Guidé compte par compte, comme le programme sur 8 semaines. Les admins l'ont
-- toujours. La table n'est accessible ni en lecture ni en écriture depuis l'app : on passe par
-- guide_autorise() (pour soi), admin_acces_guide() et admin_comptes_guide() (admin seulement).

create table public.acces_guide (
  user_id uuid primary key references auth.users (id) on delete cascade,
  accorde timestamptz not null default now(),
  par     uuid
);
alter table public.acces_guide enable row level security;
revoke all on public.acces_guide from anon, authenticated;

-- Le compte connecté a-t-il accès au mode Guidé ? Les admins l'ont toujours.
create function public.guide_autorise()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.acces_guide where user_id = (select auth.uid()))
      or exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- Ouvrir ou fermer le mode Guidé d'un compte (admin seulement). Noté dans admin_journal.
create function public.admin_acces_guide(p_user uuid, p_acces boolean)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_mail text;
  v_pseudo text;
begin
  perform public.exiger_admin();
  if p_acces then
    insert into public.acces_guide (user_id, par) values (p_user, (select auth.uid()))
    on conflict (user_id) do nothing;
  else
    delete from public.acces_guide where user_id = p_user;
  end if;
  select u.email, e.pseudo into v_mail, v_pseudo
  from auth.users u left join public.etats e on e.user_id = u.id where u.id = p_user;
  insert into public.admin_journal (admin, action, compte, pseudo, email)
  values ((select auth.uid()), case when p_acces then 'guide_ouvert' else 'guide_ferme' end, p_user, v_pseudo, v_mail);
  return p_acces;
end;
$$;

-- Les comptes qui ont le mode Guidé ouvert (fiche admin).
create function public.admin_comptes_guide()
returns uuid[]
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exiger_admin();
  return coalesce((select array_agg(user_id) from public.acces_guide), '{}');
end;
$$;

revoke all on function public.guide_autorise(), public.admin_acces_guide(uuid, boolean), public.admin_comptes_guide() from public, anon;
grant execute on function public.guide_autorise(), public.admin_acces_guide(uuid, boolean), public.admin_comptes_guide() to authenticated;
