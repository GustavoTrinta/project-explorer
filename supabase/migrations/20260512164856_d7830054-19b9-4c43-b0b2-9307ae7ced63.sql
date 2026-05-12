
-- =====================================================
-- PORTAL 30% - Etapa 1: Fundação
-- Prefixo: portal_  (evita conflito com tabelas existentes)
-- =====================================================

-- ----- ENUMS -----
CREATE TYPE public.portal_papel AS ENUM ('admin_interno', 'colaborador_interno', 'cliente');
CREATE TYPE public.portal_canal AS ENUM ('portal', 'whatsapp', 'email');
CREATE TYPE public.portal_status_tarefa AS ENUM ('aberta', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE public.portal_status_obrigacao AS ENUM ('pendente', 'em_andamento', 'entregue', 'atrasada');
CREATE TYPE public.portal_status_documento AS ENUM ('ativo', 'arquivado');
CREATE TYPE public.portal_status_empresa AS ENUM ('ativa', 'inativa', 'onboarding');

-- ----- TABELAS -----
CREATE TABLE public.portal_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  nome_fantasia text,
  cnpj text UNIQUE,
  email text,
  telefone text,
  status portal_status_empresa NOT NULL DEFAULT 'ativa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.portal_usuario_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid NOT NULL REFERENCES public.portal_empresas(id) ON DELETE CASCADE,
  papel portal_papel NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, empresa_id)
);
CREATE INDEX idx_portal_usuario_empresa_user ON public.portal_usuario_empresa(user_id);
CREATE INDEX idx_portal_usuario_empresa_empresa ON public.portal_usuario_empresa(empresa_id);

CREATE TABLE public.portal_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.portal_empresas(id) ON DELETE CASCADE,
  autor_id uuid,
  canal portal_canal NOT NULL DEFAULT 'portal',
  conteudo text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_portal_mensagens_empresa ON public.portal_mensagens(empresa_id, created_at DESC);

CREATE TABLE public.portal_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.portal_empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text,
  storage_path text NOT NULL,
  tamanho bigint,
  uploaded_by uuid,
  status portal_status_documento NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_portal_documentos_empresa ON public.portal_documentos(empresa_id);

CREATE TABLE public.portal_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.portal_empresas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  responsavel_id uuid,
  status portal_status_tarefa NOT NULL DEFAULT 'aberta',
  prazo date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_portal_tarefas_empresa ON public.portal_tarefas(empresa_id);

CREATE TABLE public.portal_obrigacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.portal_empresas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  competencia text,
  vencimento date,
  status portal_status_obrigacao NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_portal_obrigacoes_empresa ON public.portal_obrigacoes(empresa_id);

-- ----- TRIGGERS DE updated_at (reusa public.set_updated_at existente) -----
CREATE TRIGGER trg_portal_empresas_updated BEFORE UPDATE ON public.portal_empresas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_portal_documentos_updated BEFORE UPDATE ON public.portal_documentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_portal_tarefas_updated BEFORE UPDATE ON public.portal_tarefas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_portal_obrigacoes_updated BEFORE UPDATE ON public.portal_obrigacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----- FUNÇÕES DE SEGURANÇA -----
CREATE OR REPLACE FUNCTION public.portal_is_interno(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.portal_usuario_empresa
    WHERE user_id = _user_id AND papel IN ('admin_interno','colaborador_interno')
  );
$$;

CREATE OR REPLACE FUNCTION public.portal_is_admin_interno(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.portal_usuario_empresa
    WHERE user_id = _user_id AND papel = 'admin_interno'
  );
$$;

CREATE OR REPLACE FUNCTION public.portal_is_membro_empresa(_user_id uuid, _empresa_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.portal_usuario_empresa
    WHERE user_id = _user_id AND empresa_id = _empresa_id
  );
$$;

-- ----- RLS -----
ALTER TABLE public.portal_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_usuario_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_obrigacoes ENABLE ROW LEVEL SECURITY;

-- portal_empresas
CREATE POLICY "portal_empresas_select" ON public.portal_empresas FOR SELECT
  USING (public.portal_is_interno(auth.uid()) OR public.portal_is_membro_empresa(auth.uid(), id));
CREATE POLICY "portal_empresas_insert" ON public.portal_empresas FOR INSERT
  WITH CHECK (public.portal_is_admin_interno(auth.uid()));
CREATE POLICY "portal_empresas_update" ON public.portal_empresas FOR UPDATE
  USING (public.portal_is_admin_interno(auth.uid()));
CREATE POLICY "portal_empresas_delete" ON public.portal_empresas FOR DELETE
  USING (public.portal_is_admin_interno(auth.uid()));

-- portal_usuario_empresa
CREATE POLICY "portal_ue_select_self" ON public.portal_usuario_empresa FOR SELECT
  USING (user_id = auth.uid() OR public.portal_is_interno(auth.uid()));
CREATE POLICY "portal_ue_insert_admin" ON public.portal_usuario_empresa FOR INSERT
  WITH CHECK (public.portal_is_admin_interno(auth.uid()));
CREATE POLICY "portal_ue_update_admin" ON public.portal_usuario_empresa FOR UPDATE
  USING (public.portal_is_admin_interno(auth.uid()));
CREATE POLICY "portal_ue_delete_admin" ON public.portal_usuario_empresa FOR DELETE
  USING (public.portal_is_admin_interno(auth.uid()));

-- portal_mensagens
CREATE POLICY "portal_msg_select" ON public.portal_mensagens FOR SELECT
  USING (public.portal_is_interno(auth.uid()) OR public.portal_is_membro_empresa(auth.uid(), empresa_id));
CREATE POLICY "portal_msg_insert" ON public.portal_mensagens FOR INSERT
  WITH CHECK (
    autor_id = auth.uid() AND
    (public.portal_is_interno(auth.uid()) OR public.portal_is_membro_empresa(auth.uid(), empresa_id))
  );

-- portal_documentos
CREATE POLICY "portal_doc_select" ON public.portal_documentos FOR SELECT
  USING (public.portal_is_interno(auth.uid()) OR public.portal_is_membro_empresa(auth.uid(), empresa_id));
CREATE POLICY "portal_doc_insert" ON public.portal_documentos FOR INSERT
  WITH CHECK (public.portal_is_interno(auth.uid()) OR public.portal_is_membro_empresa(auth.uid(), empresa_id));
CREATE POLICY "portal_doc_update_interno" ON public.portal_documentos FOR UPDATE
  USING (public.portal_is_interno(auth.uid()));
CREATE POLICY "portal_doc_delete_interno" ON public.portal_documentos FOR DELETE
  USING (public.portal_is_interno(auth.uid()));

-- portal_tarefas (somente internos)
CREATE POLICY "portal_tar_select" ON public.portal_tarefas FOR SELECT
  USING (public.portal_is_interno(auth.uid()));
CREATE POLICY "portal_tar_insert" ON public.portal_tarefas FOR INSERT
  WITH CHECK (public.portal_is_interno(auth.uid()));
CREATE POLICY "portal_tar_update" ON public.portal_tarefas FOR UPDATE
  USING (public.portal_is_interno(auth.uid()));
CREATE POLICY "portal_tar_delete" ON public.portal_tarefas FOR DELETE
  USING (public.portal_is_interno(auth.uid()));

-- portal_obrigacoes
CREATE POLICY "portal_obr_select" ON public.portal_obrigacoes FOR SELECT
  USING (public.portal_is_interno(auth.uid()) OR public.portal_is_membro_empresa(auth.uid(), empresa_id));
CREATE POLICY "portal_obr_insert" ON public.portal_obrigacoes FOR INSERT
  WITH CHECK (public.portal_is_interno(auth.uid()));
CREATE POLICY "portal_obr_update" ON public.portal_obrigacoes FOR UPDATE
  USING (public.portal_is_interno(auth.uid()));
CREATE POLICY "portal_obr_delete" ON public.portal_obrigacoes FOR DELETE
  USING (public.portal_is_interno(auth.uid()));

-- ----- STORAGE BUCKET -----
INSERT INTO storage.buckets (id, name, public) VALUES ('portal-documentos', 'portal-documentos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "portal_storage_select" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'portal-documentos' AND (
      public.portal_is_interno(auth.uid()) OR
      public.portal_is_membro_empresa(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );
CREATE POLICY "portal_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portal-documentos' AND (
      public.portal_is_interno(auth.uid()) OR
      public.portal_is_membro_empresa(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );
CREATE POLICY "portal_storage_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'portal-documentos' AND public.portal_is_interno(auth.uid()));
CREATE POLICY "portal_storage_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'portal-documentos' AND public.portal_is_interno(auth.uid()));

-- ----- REALTIME -----
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_tarefas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_obrigacoes;
