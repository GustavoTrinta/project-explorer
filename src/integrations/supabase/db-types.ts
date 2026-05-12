// Tipos mínimos da Etapa 1.
// Para gerar tipos completos a partir do schema do seu projeto Supabase:
//   npx supabase gen types typescript --project-id <ref> > src/integrations/supabase/db-types.ts

export type Papel = "admin_interno" | "colaborador_interno" | "cliente";
export type Canal = "whatsapp" | "email" | "portal";
export type Direcao = "entrada" | "saida";
export type StatusTarefa = "a_fazer" | "em_andamento" | "concluido";
export type StatusEmpresa = "ativo" | "inativo";

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  codigo: string | null;
  cor_avatar: string | null;
  whatsapp_numero: string | null;
  email_contato: string | null;
  sharepoint_site_id: string | null;
  status: StatusEmpresa;
  created_at: string;
}

export interface Profile {
  id: string;
  nome: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UsuarioEmpresa {
  user_id: string;
  empresa_id: string;
  papel: Papel;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      empresas: { Row: Empresa; Insert: Partial<Empresa>; Update: Partial<Empresa> };
      usuario_empresa: {
        Row: UsuarioEmpresa;
        Insert: UsuarioEmpresa;
        Update: Partial<UsuarioEmpresa>;
      };
      mensagens: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      documentos: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      tarefas: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      obrigacoes: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
  };
}
