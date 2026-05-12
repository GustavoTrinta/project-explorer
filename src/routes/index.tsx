import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa } from "@/hooks/use-empresa";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { loading, user, vinculos, vinculosLoading, isInterno } = useAuth();
  const { empresaAtiva } = useEmpresa();

  if (loading || (user && vinculosLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (vinculos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground">Sem acesso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não está vinculada a nenhuma empresa. Fale com o administrador.
          </p>
        </div>
      </div>
    );
  }
  if (isInterno) return <Navigate to="/interno/dashboard" />;
  if (vinculos.length > 1 && !empresaAtiva) return <Navigate to="/selecionar-empresa" />;
  return <Navigate to="/portal/inicio" />;
}
