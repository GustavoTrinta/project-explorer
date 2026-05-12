import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/portal/mensagens")({
  component: () => <Placeholder title="Mensagens" />,
});
function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">A implementar na Etapa 2.</p>
    </div>
  );
}
