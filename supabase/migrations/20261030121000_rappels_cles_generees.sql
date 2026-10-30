-- Les clés des rappels ne passent par personne : la clé d'appel du cron est tirée ici,
-- les clés VAPID par la fonction Edge à son premier passage (rappels_enregistrer_vapid).
select vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'rappels_cle')
where not exists (select 1 from vault.secrets where name = 'rappels_cle');

create function public.rappels_enregistrer_vapid(p_public text, p_prive text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from vault.secrets where name = 'rappels_vapid_prive') then return false; end if;
  perform vault.create_secret(p_prive, 'rappels_vapid_prive');
  perform vault.create_secret(p_public, 'rappels_vapid_public');
  return true;
end;
$$;
revoke all on function public.rappels_enregistrer_vapid(text, text) from public, anon, authenticated;
grant execute on function public.rappels_enregistrer_vapid(text, text) to service_role;

-- La clé publique, pour que l'app inscrive l'appareil.
create function public.rappels_vapid_public()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'rappels_vapid_public';
$$;
revoke all on function public.rappels_vapid_public() from public, anon;
grant execute on function public.rappels_vapid_public() to authenticated;
