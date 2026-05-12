import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/interno/dashboard")({
  component: () => (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard interno</h1>
      <p className="mt-2 text-sm text-muted-foreground">A implementar na Etapa 3.</p>
    </div>
  ),
});
