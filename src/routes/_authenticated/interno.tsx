import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa } from "@/hooks/use-empresa";

export const Route = createFileRoute("/_authenticated/interno")({ component: InternoLayout });

function InternoLayout() {
  const { loading, user, vinculosLoading, isInterno } = useAuth();
  const { empresaAtiva } = useEmpresa();

  if (loading || vinculosLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (!isInterno) return <Navigate to="/portal/inicio" />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar area="interno" />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center gap-2 border-b bg-card px-3">
            <SidebarTrigger />
            <span className="text-sm font-medium">Painel interno</span>
            {empresaAtiva && (
              <span className="text-xs text-muted-foreground">· filtro: {empresaAtiva.empresa.nome}</span>
            )}
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
