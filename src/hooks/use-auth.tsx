import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Papel } from "@/integrations/supabase/db-types";

export interface VinculoEmpresa {
  empresa_id: string;
  papel: Papel;
  empresa: { id: string; nome: string; cnpj: string | null };
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  vinculos: VinculoEmpresa[];
  vinculosLoading: boolean;
  isInterno: boolean;
  refreshVinculos: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [vinculos, setVinculos] = useState<VinculoEmpresa[]>([]);
  const [vinculosLoading, setVinculosLoading] = useState(false);

  useEffect(() => {
    // listener PRIMEIRO
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadVinculos = async (uid: string) => {
    setVinculosLoading(true);
    const { data, error } = await supabase
      .from("portal_usuario_empresa")
      .select("empresa_id, papel, empresa:portal_empresas(id, nome, cnpj)")
      .eq("user_id", uid);
    if (!error && data) {
      setVinculos(data as unknown as VinculoEmpresa[]);
    } else {
      setVinculos([]);
    }
    setVinculosLoading(false);
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadVinculos(session.user.id);
    } else {
      setVinculos([]);
    }
  }, [session?.user?.id]);

  const isInterno = vinculos.some(
    (v) => v.papel === "admin_interno" || v.papel === "colaborador_interno",
  );

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    loading,
    vinculos,
    vinculosLoading,
    isInterno,
    refreshVinculos: async () => {
      if (session?.user?.id) await loadVinculos(session.user.id);
    },
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return v;
}
