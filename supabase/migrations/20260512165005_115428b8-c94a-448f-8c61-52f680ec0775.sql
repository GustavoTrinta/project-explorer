
REVOKE EXECUTE ON FUNCTION public.portal_is_interno(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.portal_is_admin_interno(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.portal_is_membro_empresa(uuid, uuid) FROM PUBLIC, anon, authenticated;
