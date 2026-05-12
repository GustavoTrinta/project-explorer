import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth, type VinculoEmpresa } from "./use-auth";

const STORAGE_KEY = "portal30:empresa_ativa";

interface EmpresaCtx {
  empresaAtiva: VinculoEmpresa | null;
  setEmpresaAtiva: (v: VinculoEmpresa) => void;
  clear: () => void;
}

const Ctx = createContext<EmpresaCtx | null>(null);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { vinculos, user } = useAuth();
  const [empresaAtiva, setAtiva] = useState<VinculoEmpresa | null>(null);

  // Restaura / sincroniza com a lista de vínculos
  useEffect(() => {
    if (!user) {
      setAtiva(null);
      return;
    }
    if (vinculos.length === 0) return;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const match = stored ? vinculos.find((v) => v.empresa_id === stored) : null;
    if (match) setAtiva(match);
    else if (vinculos.length === 1) setAtiva(vinculos[0]);
  }, [vinculos, user]);

  const setEmpresaAtiva = (v: VinculoEmpresa) => {
    setAtiva(v);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, v.empresa_id);
  };

  const clear = () => {
    setAtiva(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  };

  return <Ctx.Provider value={{ empresaAtiva, setEmpresaAtiva, clear }}>{children}</Ctx.Provider>;
}

export function useEmpresa() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEmpresa deve ser usado dentro de <EmpresaProvider>");
  return v;
}
