-- Une génération qui n'aboutit pas (IA indisponible, réponse illisible) rend
-- l'unité de quota qu'elle avait consommée. Appelée uniquement par generer (service_role).
create function public.rendre_quota(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.quotas_generation
     set n = greatest(n - 1, 0)
   where user_id = p_user and jour = current_date;
$$;
revoke all on function public.rendre_quota(uuid) from public, anon, authenticated;
grant execute on function public.rendre_quota(uuid) to service_role;
