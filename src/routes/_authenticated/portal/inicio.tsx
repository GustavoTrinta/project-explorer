import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/use-empresa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, CalendarClock, CheckSquare, ArrowRight } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/portal/inicio")({ component: InicioPotalPage });

type Mensagem = Tables<"portal_mensagens">;
type Obrigacao = Tables<"portal_obrigacoes">;
type Documento = Tables<"portal_documentos">;

interface KPIs {
  mensagensNaoLidas: number;
  documentosNovos: number;
  obrigacoesProximas: number;
  tarefasAbertas: number;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  href,
  variant = "default",
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  href: string;
  variant?: "default" | "warning" | "danger";
}) {
  const colors = {
    default: "text-primary",
    warning: "text-yellow-600",
    danger: "text-destructive",
  };
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", colors[variant])} />
      </CardHeader>
      <CardContent>
        <p className={cn("text-3xl font-bold", colors[variant])}>{value}</p>
        <Link to={href} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Ver detalhes <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

function InicioPotalPage() {
  const { empresaAtiva } = useEmpresa();
  const empresaId = empresaAtiva?.empresa?.id;

  const [kpis, setKpis] = useState<KPIs>({
    mensagensNaoLidas: 0,
    documentosNovos: 0,
    obrigacoesProximas: 0,
    tarefasAbertas: 0,
  });
  const [mensagensRecentes, setMensagensRecentes] = useState<Mensagem[]>([]);
  const [obrigacoesRecentes, setObrigacoesRecentes] = useState<Obrigacao[]>([]);
  const [documentosRecentes, setDocumentosRecentes] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) return;

    const carregar = async () => {
      const [{ data: msgs }, { data: obs }, { data: docs }, { data: tarefas }] = await Promise.all([
        supabase
          .from("portal_mensagens")
          .select("*")
          .eq("empresa_id", empresaId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("portal_obrigacoes")
          .select("*")
          .eq("empresa_id", empresaId)
          .neq("status", "entregue")
          .order("vencimento", { ascending: true })
          .limit(5),
        supabase
          .from("portal_documentos")
          .select("*")
          .eq("empresa_id", empresaId)
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("portal_tarefas")
          .select("id")
          .eq("empresa_id", empresaId)
          .in("status", ["aberta", "em_andamento"]),
      ]);

      const msgEntrada = (msgs ?? []).filter((m) => {
        const meta = m.metadata as Record<string, unknown>;
        return meta?.direcao !== "saida";
      });

      const obsAtrasadasOuProximas = (obs ?? []).filter(
        (o) => o.vencimento,
      );

      setKpis({
        mensagensNaoLidas: msgEntrada.length,
        documentosNovos: (docs ?? []).length,
        obrigacoesProximas: obsAtrasadasOuProximas.length,
        tarefasAbertas: (tarefas ?? []).length,
      });

      setMensagensRecentes((msgs ?? []) as Mensagem[]);
      setObrigacoesRecentes((obs ?? []) as Obrigacao[]);
      setDocumentosRecentes((docs ?? []) as Documento[]);
      setLoading(false);
    };

    carregar();
  }, [empresaId]);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const empresa = empresaAtiva?.empresa;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{saudacao}!</h1>
        <p className="text-sm text-muted-foreground">
          Você está acessando <strong>{empresa?.nome}</strong>.
          {empresa?.cnpj && <span className="ml-1 text-muted-foreground/70">CNPJ {empresa.cnpj}</span>}
        </p>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><div className="h-3 w-32 rounded bg-muted animate-pulse" /></CardHeader>
              <CardContent><div className="h-8 w-12 rounded bg-muted animate-pulse" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Mensagens"
            value={kpis.mensagensNaoLidas}
            icon={MessageSquare}
            href="/portal/mensagens"
            variant={kpis.mensagensNaoLidas > 0 ? "warning" : "default"}
          />
          <KpiCard
            title="Documentos disponíveis"
            value={kpis.documentosNovos}
            icon={FileText}
            href="/portal/documentos"
          />
          <KpiCard
            title="Obrigações pendentes"
            value={kpis.obrigacoesProximas}
            icon={CalendarClock}
            href="/portal/obrigacoes"
            variant={kpis.obrigacoesProximas > 0 ? "warning" : "default"}
          />
          <KpiCard
            title="Tarefas em andamento"
            value={kpis.tarefasAbertas}
            icon={CheckSquare}
            href="/portal/mensagens"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mensagens recentes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Últimas mensagens</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/portal/mensagens">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mensagensRecentes.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma mensagem ainda.</p>
            )}
            {mensagensRecentes.map((m) => {
              const meta = m.metadata as Record<string, unknown>;
              const saida = meta?.direcao === "saida";
              return (
                <div key={m.id} className="flex items-start gap-2.5">
                  <div className={cn(
                    "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                    saida ? "bg-muted" : "bg-accent",
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">{m.conteudo}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {saida ? "Trinta Porcento" : "Você"} ·{" "}
                      {formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                  <CanalTag canal={m.canal as "whatsapp" | "email" | "portal"} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Obrigações próximas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Obrigações</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/portal/obrigacoes">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {obrigacoesRecentes.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma obrigação pendente.</p>
            )}
            {obrigacoesRecentes.map((o) => {
              const atrasada = o.vencimento && isPast(new Date(o.vencimento));
              return (
                <div key={o.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{o.titulo}</p>
                    {o.vencimento && (
                      <p className={cn("text-[10px]", atrasada ? "text-destructive" : "text-muted-foreground/60")}>
                        {atrasada ? "Atrasada · " : ""}
                        {formatDistanceToNow(new Date(o.vencimento), { locale: ptBR, addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <StatusObrigacaoBadge status={o.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Documentos recentes */}
      {documentosRecentes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Documentos recentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/portal/documentos">Ver todos <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {documentosRecentes.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{d.nome}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {d.tamanho ? `${Math.round(d.tamanho / 1024)} KB · ` : ""}
                      {formatDistanceToNow(new Date(d.created_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CanalTag({ canal }: { canal: "whatsapp" | "email" | "portal" }) {
  const map = {
    whatsapp: { label: "WA", cls: "bg-whatsapp text-white" },
    email: { label: "Email", cls: "bg-email text-white" },
    portal: { label: "Portal", cls: "bg-accent text-accent-foreground" },
  };
  const { label, cls } = map[canal] ?? map.portal;
  return (
    <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium", cls)}>{label}</span>
  );
}

function StatusObrigacaoBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pendente: { label: "pendente", variant: "outline" },
    em_andamento: { label: "andamento", variant: "secondary" },
    entregue: { label: "entregue", variant: "default" },
    atrasada: { label: "atrasada", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={variant} className="h-4 shrink-0 px-1.5 text-[9px]">{label}</Badge>;
}
