import { createFileRoute, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa } from "@/hooks/use-empresa";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/portal")({ component: PortalLayout });

function PortalLayout() {
  const { loading, user, vinculos, vinculosLoading, isInterno } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const navigate = useNavigate();

  // Internos podem entrar no portal, mas redirecionamos por padrão para o painel deles
  useEffect(() => {
    if (!loading && !vinculosLoading && user && isInterno && !empresaAtiva) {
      // sem empresa ativa, manda para dashboard interno
      navigate({ to: "/interno/dashboard" });
    }
  }, [loading, vinculosLoading, user, isInterno, empresaAtiva, navigate]);

  if (loading || vinculosLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" />;
  if (vinculos.length === 0) return <Navigate to="/" />;
  if (vinculos.length > 1 && !empresaAtiva) return <Navigate to="/selecionar-empresa" />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar area="portal" />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center gap-2 border-b bg-card px-3">
            <SidebarTrigger />
            <span className="text-sm font-medium">{empresaAtiva?.empresa.nome}</span>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Carregando…</p>
    </div>
  );
}
