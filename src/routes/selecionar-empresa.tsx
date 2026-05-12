import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa } from "@/hooks/use-empresa";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/selecionar-empresa")({ component: Page });

function Page() {
  const { user, loading, vinculos, isInterno } = useAuth();
  const { setEmpresaAtiva } = useEmpresa();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Selecionar empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Você tem acesso a {vinculos.length} empresas. Escolha qual deseja abrir.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {vinculos.map((v) => (
            <Card
              key={v.empresa_id}
              role="button"
              onClick={() => {
                setEmpresaAtiva(v);
                navigate({ to: isInterno ? "/interno/dashboard" : "/portal/inicio" });
              }}
              className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
                style={{ backgroundColor: v.empresa.cor_avatar ?? "#1a1a2e" }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{v.empresa.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {v.empresa.cnpj ?? "—"} · {v.papel.replace("_", " ")}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
