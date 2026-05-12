import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, AlertTriangle, CalendarClock, CheckSquare, ArrowRight } from "lucide-react";
import { formatDistanceToNow, isPast, isWithinInterval, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/interno/dashboard")({
  component: DashboardPage,
});

type Mensagem = Tables<"portal_mensagens"> & { empresa: { nome: string } | null };
type Obrigacao = Tables<"portal_obrigacoes"> & { empresa: { nome: string } | null };
type Tarefa = Tables<"portal_tarefas"> & { empresa: { nome: string } | null };

interface KPIs {
  mensagensNaoRespondidas: number;
  obrigacoesAtrasadas: number;
  obrigacoesProximas: number;
  tarefasAbertas: number;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "danger";
  href?: string;
}) {
  const colors = {
    default: "text-primary",
    warning: "text-yellow-600",
    danger: "text-destructive",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", colors[variant])} />
      </CardHeader>
      <CardContent>
        <p className={cn("text-3xl font-bold", colors[variant])}>{value}</p>
        {href && (
          <Link to={href} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            Ver detalhes <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs>({
    mensagensNaoRespondidas: 0,
    obrigacoesAtrasadas: 0,
    obrigacoesProximas: 0,
    tarefasAbertas: 0,
  });
  const [mensagensRecentes, setMensagensRecentes] = useState<Mensagem[]>([]);
  const [obrigacoesUrgentes, setObrigacoesUrgentes] = useState<Obrigacao[]>([]);
  const [tarefasUrgentes, setTarefasUrgentes] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      const hoje = new Date();
      const em7Dias = addDays(hoje, 7);

      const [{ data: msgs }, { data: obs }, { data: tarefas }] = await Promise.all([
        supabase
          .from("portal_mensagens")
          .select("*, empresa:portal_empresas(nome)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("portal_obrigacoes")
          .select("*, empresa:portal_empresas(nome)")
          .in("status", ["pendente", "em_andamento"])
          .order("vencimento", { ascending: true }),
        supabase
          .from("portal_tarefas")
          .select("*, empresa:portal_empresas(nome)")
          .in("status", ["aberta", "em_andamento"])
          .order("prazo", { ascending: true }),
      ]);

      // KPI: mensagens sem resposta = de entrada (sem direcao=saida) nas últimas 48h
      const naoRespondidas = (msgs ?? []).filter((m) => {
        const meta = m.metadata as Record<string, unknown>;
        return meta?.direcao !== "saida";
      });

      // KPI: obrigações atrasadas
      const atrasadas = (obs ?? []).filter(
        (o) => o.vencimento && isPast(new Date(o.vencimento)) && o.status !== "entregue",
      );

      // KPI: obrigações que vencem nos próximos 7 dias
      const proximas = (obs ?? []).filter(
        (o) =>
          o.vencimento &&
          !isPast(new Date(o.vencimento)) &&
          isWithinInterval(new Date(o.vencimento), { start: hoje, end: em7Dias }),
      );

      setKpis({
        mensagensNaoRespondidas: naoRespondidas.length,
        obrigacoesAtrasadas: atrasadas.length,
        obrigacoesProximas: proximas.length,
        tarefasAbertas: (tarefas ?? []).length,
      });

      setMensagensRecentes((msgs ?? []).slice(0, 5) as Mensagem[]);
      setObrigacoesUrgentes([...atrasadas, ...proximas].slice(0, 5) as Obrigacao[]);
      setTarefasUrgentes(((tarefas ?? []) as Tarefa[]).slice(0, 5));

      setLoading(false);
    };

    carregar();

    // Realtime: atualiza KPIs quando há nova mensagem
    const ch = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "portal_mensagens" }, () => carregar())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "portal_obrigacoes" }, () => carregar())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "portal_tarefas" }, () => carregar())
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral em tempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Mensagens não respondidas"
          value={kpis.mensagensNaoRespondidas}
          icon={Inbox}
          variant={kpis.mensagensNaoRespondidas > 0 ? "warning" : "default"}
          href="/interno/mensagens"
        />
        <KpiCard
          title="Obrigações atrasadas"
          value={kpis.obrigacoesAtrasadas}
          icon={AlertTriangle}
          variant={kpis.obrigacoesAtrasadas > 0 ? "danger" : "default"}
        />
        <KpiCard
          title="Vencem em 7 dias"
          value={kpis.obrigacoesProximas}
          icon={CalendarClock}
          variant={kpis.obrigacoesProximas > 2 ? "warning" : "default"}
        />
        <KpiCard
          title="Tarefas em aberto"
          value={kpis.tarefasAbertas}
          icon={CheckSquare}
          href="/interno/tarefas"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mensagens recentes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Mensagens recentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/interno/mensagens">
                  Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mensagensRecentes.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma mensagem.</p>
            )}
            {mensagensRecentes.map((m) => {
              const meta = m.metadata as Record<string, unknown>;
              const entrada = meta?.direcao !== "saida";
              return (
                <div key={m.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">{m.empresa?.nome ?? "—"}</span>
                    <CanalPill canal={m.canal as "whatsapp" | "email" | "portal"} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{m.conteudo}</p>
                  <div className="flex items-center gap-1.5">
                    {entrada && <Badge variant="secondary" className="h-4 px-1 text-[9px]">entrada</Badge>}
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Obrigações urgentes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Obrigações urgentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {obrigacoesUrgentes.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma obrigação urgente.</p>
            )}
            {obrigacoesUrgentes.map((o) => {
              const atrasada = o.vencimento && isPast(new Date(o.vencimento));
              return (
                <div key={o.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">{o.titulo}</span>
                    <Badge
                      variant={atrasada ? "destructive" : "secondary"}
                      className="shrink-0 text-[9px]"
                    >
                      {atrasada ? "atrasada" : "próxima"}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{o.empresa?.nome}</p>
                  {o.vencimento && (
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(o.vencimento), { locale: ptBR, addSuffix: true })}
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Tarefas urgentes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Tarefas em aberto</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/interno/tarefas">
                  Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tarefasUrgentes.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma tarefa em aberto.</p>
            )}
            {tarefasUrgentes.map((t) => {
              const atrasada = t.prazo && isPast(new Date(t.prazo));
              return (
                <div key={t.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">{t.titulo}</span>
                    <StatusTarefaBadge status={t.status as string} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.empresa?.nome}</p>
                  {t.prazo && (
                    <span className={cn("text-[10px]", atrasada ? "text-destructive" : "text-muted-foreground/60")}>
                      {formatDistanceToNow(new Date(t.prazo), { locale: ptBR, addSuffix: true })}
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CanalPill({ canal }: { canal: "whatsapp" | "email" | "portal" }) {
  const map = {
    whatsapp: { label: "WA", className: "bg-whatsapp text-white" },
    email: { label: "Email", className: "bg-email text-white" },
    portal: { label: "Portal", className: "bg-accent text-accent-foreground" },
  };
  const { label, className } = map[canal] ?? map.portal;
  return (
    <span className={cn("inline-block rounded-full px-1.5 py-0 text-[9px] font-medium", className)}>
      {label}
    </span>
  );
}

function StatusTarefaBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    aberta: { label: "aberta", variant: "outline" },
    em_andamento: { label: "andamento", variant: "secondary" },
    concluida: { label: "concluída", variant: "default" },
    cancelada: { label: "cancelada", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={variant} className="h-4 shrink-0 px-1 text-[9px]">{label}</Badge>;
}
