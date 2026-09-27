-- Retour arrière manuel de la migration rendre_quota.
-- À n'appliquer qu'après avoir redéployé une version de generer qui n'appelle plus rendre_quota.
drop function if exists public.rendre_quota(uuid);
