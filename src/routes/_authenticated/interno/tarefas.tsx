import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/interno/tarefas")({
  component: () => (
    <div>
      <h1 className="text-2xl font-semibold">Tarefas (Kanban)</h1>
      <p className="mt-2 text-sm text-muted-foreground">A implementar na Etapa 8.</p>
    </div>
  ),
});
