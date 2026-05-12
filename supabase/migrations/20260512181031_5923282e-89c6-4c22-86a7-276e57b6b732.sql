GRANT EXECUTE ON FUNCTION public.portal_is_interno(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.portal_is_admin_interno(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.portal_is_membro_empresa(uuid, uuid) TO authenticated, anon;