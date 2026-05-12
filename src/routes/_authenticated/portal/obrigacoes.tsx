import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/portal/obrigacoes")({
  component: () => (
    <div>
      <h1 className="text-2xl font-semibold">Obrigações</h1>
      <p className="mt-2 text-sm text-muted-foreground">A implementar nas próximas etapas.</p>
    </div>
  ),
});
