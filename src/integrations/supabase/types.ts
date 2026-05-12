export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          area_id: number
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id: number
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: number
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "knowledge_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          area_id: number
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          area_id: number
          chunk_index?: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          area_id?: number
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "knowledge_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_events: {
        Row: {
          actor_id: string | null
          area_id: number
          created_at: string
          details: Json
          document_id: string
          event_type: string
          id: string
        }
        Insert: {
          actor_id?: string | null
          area_id: number
          created_at?: string
          details?: Json
          document_id: string
          event_type: string
          id?: string
        }
        Update: {
          actor_id?: string | null
          area_id?: number
          created_at?: string
          details?: Json
          document_id?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_events_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "knowledge_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          archived_at: string | null
          area_id: number
          chunk_count: number | null
          created_at: string
          display_name: string | null
          error_message: string | null
          file_size: number | null
          filename: string
          id: string
          mime_type: string | null
          normalized_size: number | null
          normalized_storage_path: string | null
          original_name: string
          processed_at: string | null
          replaces_document_id: string | null
          sharepoint_url: string | null
          source_kind: string
          status: string
          storage_path: string | null
          tags: string[]
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          archived_at?: string | null
          area_id: number
          chunk_count?: number | null
          created_at?: string
          display_name?: string | null
          error_message?: string | null
          file_size?: number | null
          filename: string
          id?: string
          mime_type?: string | null
          normalized_size?: number | null
          normalized_storage_path?: string | null
          original_name: string
          processed_at?: string | null
          replaces_document_id?: string | null
          sharepoint_url?: string | null
          source_kind?: string
          status?: string
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          archived_at?: string | null
          area_id?: number
          chunk_count?: number | null
          created_at?: string
          display_name?: string | null
          error_message?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string | null
          normalized_size?: number | null
          normalized_storage_path?: string | null
          original_name?: string
          processed_at?: string | null
          replaces_document_id?: string | null
          sharepoint_url?: string | null
          source_kind?: string
          status?: string
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "knowledge_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_replaces_document_id_fkey"
            columns: ["replaces_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_areas: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      portal_documentos: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["portal_status_documento"]
          storage_path: string
          tamanho: number | null
          tipo: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["portal_status_documento"]
          storage_path: string
          tamanho?: number | null
          tipo?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["portal_status_documento"]
          storage_path?: string
          tamanho?: number | null
          tipo?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "portal_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_empresas: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          nome_fantasia: string | null
          status: Database["public"]["Enums"]["portal_status_empresa"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          nome_fantasia?: string | null
          status?: Database["public"]["Enums"]["portal_status_empresa"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          nome_fantasia?: string | null
          status?: Database["public"]["Enums"]["portal_status_empresa"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      portal_mensagens: {
        Row: {
          autor_id: string | null
          canal: Database["public"]["Enums"]["portal_canal"]
          conteudo: string
          created_at: string
          empresa_id: string
          id: string
          metadata: Json
        }
        Insert: {
          autor_id?: string | null
          canal?: Database["public"]["Enums"]["portal_canal"]
          conteudo: string
          created_at?: string
          empresa_id: string
          id?: string
          metadata?: Json
        }
        Update: {
          autor_id?: string | null
          canal?: Database["public"]["Enums"]["portal_canal"]
          conteudo?: string
          created_at?: string
          empresa_id?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "portal_mensagens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "portal_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_obrigacoes: {
        Row: {
          competencia: string | null
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          status: Database["public"]["Enums"]["portal_status_obrigacao"]
          titulo: string
          updated_at: string
          vencimento: string | null
        }
        Insert: {
          competencia?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          status?: Database["public"]["Enums"]["portal_status_obrigacao"]
          titulo: string
          updated_at?: string
          vencimento?: string | null
        }
        Update: {
          competencia?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          status?: Database["public"]["Enums"]["portal_status_obrigacao"]
          titulo?: string
          updated_at?: string
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_obrigacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "portal_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_tarefas: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          prazo: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["portal_status_tarefa"]
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["portal_status_tarefa"]
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["portal_status_tarefa"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_tarefas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "portal_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_usuario_empresa: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          papel: Database["public"]["Enums"]["portal_papel"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          papel: Database["public"]["Enums"]["portal_papel"]
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          papel?: Database["public"]["Enums"]["portal_papel"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_usuario_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "portal_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      match_document_chunks: {
        Args: {
          area_slug: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          document_name: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      portal_is_admin_interno: { Args: { _user_id: string }; Returns: boolean }
      portal_is_interno: { Args: { _user_id: string }; Returns: boolean }
      portal_is_membro_empresa: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      portal_canal: "portal" | "whatsapp" | "email"
      portal_papel: "admin_interno" | "colaborador_interno" | "cliente"
      portal_status_documento: "ativo" | "arquivado"
      portal_status_empresa: "ativa" | "inativa" | "onboarding"
      portal_status_obrigacao:
        | "pendente"
        | "em_andamento"
        | "entregue"
        | "atrasada"
      portal_status_tarefa:
        | "aberta"
        | "em_andamento"
        | "concluida"
        | "cancelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      portal_canal: ["portal", "whatsapp", "email"],
      portal_papel: ["admin_interno", "colaborador_interno", "cliente"],
      portal_status_documento: ["ativo", "arquivado"],
      portal_status_empresa: ["ativa", "inativa", "onboarding"],
      portal_status_obrigacao: [
        "pendente",
        "em_andamento",
        "entregue",
        "atrasada",
      ],
      portal_status_tarefa: [
        "aberta",
        "em_andamento",
        "concluida",
        "cancelada",
      ],
    },
  },
} as const
