DO $$
DECLARE
  v_empresa_id uuid;
  v_user_id uuid := '352230ff-80e8-45bf-926a-848b332f077b';
BEGIN
  SELECT id INTO v_empresa_id FROM public.portal_empresas WHERE nome = 'Escritório (interno)' LIMIT 1;
  IF v_empresa_id IS NULL THEN
    INSERT INTO public.portal_empresas (nome) VALUES ('Escritório (interno)') RETURNING id INTO v_empresa_id;
  END IF;

  INSERT INTO public.portal_usuario_empresa (user_id, empresa_id, papel)
  VALUES (v_user_id, v_empresa_id, 'admin_interno')
  ON CONFLICT DO NOTHING;
END $$;