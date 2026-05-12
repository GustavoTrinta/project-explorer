import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Mail, Smartphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/interno/mensagens")({
  component: MensagensPage,
});

type Mensagem = Tables<"portal_mensagens"> & {
  empresa: { nome: string } | null;
};

type Canal = Enums<"portal_canal">;

const canalInfo: Record<Canal, { label: string; icon: React.ElementType; color: string }> = {
  whatsapp: { label: "WhatsApp", icon: Smartphone, color: "bg-whatsapp text-white" },
  email: { label: "E-mail", icon: Mail, color: "bg-email text-white" },
  portal: { label: "Portal", icon: MessageSquare, color: "bg-accent text-accent-foreground" },
};

function CanalBadge({ canal }: { canal: Canal }) {
  const info = canalInfo[canal];
  const Icon = info.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", info.color)}>
      <Icon className="h-2.5 w-2.5" />
      {info.label}
    </span>
  );
}

// Agrupa mensagens por empresa_id
function agruparPorEmpresa(mensagens: Mensagem[]) {
  const map = new Map<string, { empresa: { nome: string }; mensagens: Mensagem[] }>();
  for (const m of mensagens) {
    if (!map.has(m.empresa_id)) {
      map.set(m.empresa_id, { empresa: m.empresa ?? { nome: m.empresa_id }, mensagens: [] });
    }
    map.get(m.empresa_id)!.mensagens.push(m);
  }
  return [...map.entries()].map(([id, v]) => ({ empresa_id: id, ...v }));
}

function MensagensPage() {
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carrega todas as mensagens de todos os clientes
  const carregar = async () => {
    const { data } = await supabase
      .from("portal_mensagens")
      .select("*, empresa:portal_empresas(nome)")
      .order("created_at", { ascending: true });
    if (data) setMensagens(data as Mensagem[]);
    setLoading(false);
  };

  useEffect(() => {
    carregar();

    // Realtime — escuta inserções em portal_mensagens
    const channel = supabase
      .channel("mensagens-interno")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "portal_mensagens" },
        (payload) => {
          // Busca o registro completo com join da empresa
          supabase
            .from("portal_mensagens")
            .select("*, empresa:portal_empresas(nome)")
            .eq("id", (payload.new as { id: string }).id)
            .single()
            .then(({ data }) => {
              if (data) setMensagens((prev) => [...prev, data as Mensagem]);
            });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Rola para o final ao abrir thread ou nova mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [empresaSelecionada, mensagens.length]);

  const grupos = agruparPorEmpresa(mensagens);
  const thread = empresaSelecionada
    ? mensagens.filter((m) => m.empresa_id === empresaSelecionada)
    : [];
  const empresaAtual = grupos.find((g) => g.empresa_id === empresaSelecionada);

  const enviar = async () => {
    if (!texto.trim() || !empresaSelecionada || !user) return;
    setEnviando(true);
    await supabase.from("portal_mensagens").insert({
      empresa_id: empresaSelecionada,
      canal: "portal" as Canal,
      conteudo: texto.trim(),
      autor_id: user.id,
      metadata: { direcao: "saida" },
    });
    setTexto("");
    setEnviando(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden rounded-lg border border-border bg-card">
      {/* Lista de threads por empresa */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Caixa unificada</h2>
          <p className="text-xs text-muted-foreground">{grupos.length} clientes</p>
        </div>
        <ScrollArea className="flex-1">
          {loading && (
            <p className="px-4 py-6 text-xs text-muted-foreground">Carregando…</p>
          )}
          {!loading && grupos.length === 0 && (
            <p className="px-4 py-6 text-xs text-muted-foreground">Nenhuma mensagem ainda.</p>
          )}
          {grupos.map((g) => {
            const ultima = g.mensagens[g.mensagens.length - 1];
            const isAtivo = g.empresa_id === empresaSelecionada;
            return (
              <button
                key={g.empresa_id}
                onClick={() => setEmpresaSelecionada(g.empresa_id)}
                className={cn(
                  "w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  isAtivo && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{g.empresa.nome}</span>
                  <CanalBadge canal={ultima.canal} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{ultima.conteudo}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  {formatDistanceToNow(new Date(ultima.created_at), { locale: ptBR, addSuffix: true })}
                </p>
              </button>
            );
          })}
        </ScrollArea>
      </aside>

      {/* Thread de mensagens */}
      {!empresaSelecionada ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Selecione um cliente para ver a conversa
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {/* Header da thread */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {empresaAtual?.empresa.nome.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{empresaAtual?.empresa.nome}</p>
              <p className="text-xs text-muted-foreground">{thread.length} mensagens</p>
            </div>
          </div>

          {/* Mensagens */}
          <ScrollArea className="flex-1 px-5 py-4">
            <div className="flex flex-col gap-3">
              {thread.map((m) => {
                const saida =
                  m.autor_id === user?.id ||
                  (m.metadata as Record<string, unknown>)?.direcao === "saida";
                return (
                  <div
                    key={m.id}
                    className={cn("flex max-w-[70%] flex-col gap-1", saida ? "ml-auto items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm",
                        saida
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {m.conteudo}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CanalBadge canal={m.canal} />
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Caixa de resposta */}
          <div className="border-t border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="shrink-0 text-xs">
                Portal
              </Badge>
              <Input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviar()}
                placeholder="Responder via Portal…"
                className="flex-1"
                disabled={enviando}
              />
              <Button size="icon" onClick={enviar} disabled={enviando || !texto.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              A resposta será enviada pelo Portal. Integração WhatsApp/E-mail via Edge Functions (Etapa 6/7).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
