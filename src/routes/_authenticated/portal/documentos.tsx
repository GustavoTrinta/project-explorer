import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/portal/documentos")({
  component: () => (
    <div>
      <h1 className="text-2xl font-semibold">Documentos</h1>
      <p className="mt-2 text-sm text-muted-foreground">A implementar (Etapa 9 — SharePoint).</p>
    </div>
  ),
});
