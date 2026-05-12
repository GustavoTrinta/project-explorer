import { createFileRoute } from "@tanstack/react-router";
import { useEmpresa } from "@/hooks/use-empresa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/portal/inicio")({ component: Page });

function Page() {
  const { empresaAtiva } = useEmpresa();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá!</h1>
        <p className="text-sm text-muted-foreground">
          Você está acessando <strong>{empresaAtiva?.empresa.nome}</strong>.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Mensagens não lidas", "Documentos novos", "Obrigações próximas", "Tarefas em aberto"].map((t) => (
          <Card key={t}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Conteúdo real será preenchido nas próximas etapas.
      </p>
    </div>
  );
}
