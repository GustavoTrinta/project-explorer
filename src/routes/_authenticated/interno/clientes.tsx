import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { buscarUsuarioPorEmail, buscarUsuariosPorIds } from "@/lib/portal-server-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Plus, MoreHorizontal, Users, Pencil, Trash2, UserPlus, UserMinus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/interno/clientes")({ component: ClientesPage });

type Empresa = Tables<"portal_empresas">;
type StatusEmpresa = "ativa" | "inativa" | "onboarding";
type Papel = "admin_interno" | "colaborador_interno" | "cliente";

interface EmpresaComVinculos extends Empresa {
  vinculos: { id: string; user_id: string; papel: Papel; email?: string }[];
}

const PAPEIS: Record<Papel, string> = {
  admin_interno: "Admin Interno",
  colaborador_interno: "Colaborador Interno",
  cliente: "Cliente",
};

const STATUS_MAP: Record<StatusEmpresa, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativa: { label: "Ativa", variant: "default" },
  inativa: { label: "Inativa", variant: "secondary" },
  onboarding: { label: "Onboarding", variant: "outline" },
};

const EMPRESA_VAZIA = { nome: "", nome_fantasia: "", cnpj: "", email: "", telefone: "", status: "ativa" as StatusEmpresa };

function ClientesPage() {
  const [empresas, setEmpresas] = useState<EmpresaComVinculos[]>([]);
  const [loading, setLoading] = useState(true);
  // modals
  const [modalEmpresa, setModalEmpresa] = useState<"criar" | "editar" | null>(null);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [formEmpresa, setFormEmpresa] = useState(EMPRESA_VAZIA);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [erroEmpresa, setErroEmpresa] = useState<string | null>(null);

  const [modalVinculos, setModalVinculos] = useState<EmpresaComVinculos | null>(null);
  const [novoVinculoEmail, setNovoVinculoEmail] = useState("");
  const [novoVinculoPapel, setNovoVinculoPapel] = useState<Papel>("cliente");
  const [savingVinculo, setSavingVinculo] = useState(false);
  const [erroVinculo, setErroVinculo] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data: emps } = await supabase
      .from("portal_empresas")
      .select("*")
      .order("nome");

    if (!emps) { setLoading(false); return; }

    const { data: vinculos } = await supabase
      .from("portal_usuario_empresa")
      .select("id, user_id, empresa_id, papel");

    // Fetch emails for all vinculo user_ids via server function (bypasses RLS)
    const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
    const userIds = [...new Set((vinculos ?? []).map((v) => v.user_id))];
    const emailMap: Record<string, string> = {};
    if (userIds.length > 0 && token) {
      try {
        const result = await buscarUsuariosPorIds({ data: { ids: userIds, token } });
        result.users.forEach((u) => { emailMap[u.id] = u.email; });
      } catch { /* silently ignore if not authorized */ }
    }

    const result: EmpresaComVinculos[] = emps.map((emp) => ({
      ...emp,
      vinculos: (vinculos ?? [])
        .filter((v) => v.empresa_id === emp.id)
        .map((v) => ({ id: v.id, user_id: v.user_id, papel: v.papel as Papel, email: emailMap[v.user_id] })),
    }));

    setEmpresas(result);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // ---------- CRUD empresa ----------
  function abrirCriar() {
    setFormEmpresa(EMPRESA_VAZIA);
    setErroEmpresa(null);
    setEmpresaEditando(null);
    setModalEmpresa("criar");
  }

  function abrirEditar(emp: Empresa) {
    setFormEmpresa({
      nome: emp.nome,
      nome_fantasia: emp.nome_fantasia ?? "",
      cnpj: emp.cnpj ?? "",
      email: emp.email ?? "",
      telefone: emp.telefone ?? "",
      status: emp.status as StatusEmpresa,
    });
    setErroEmpresa(null);
    setEmpresaEditando(emp);
    setModalEmpresa("editar");
  }

  async function salvarEmpresa() {
    setSavingEmpresa(true);
    setErroEmpresa(null);
    const payload = {
      nome: formEmpresa.nome.trim(),
      nome_fantasia: formEmpresa.nome_fantasia.trim() || null,
      cnpj: formEmpresa.cnpj.trim() || null,
      email: formEmpresa.email.trim() || null,
      telefone: formEmpresa.telefone.trim() || null,
      status: formEmpresa.status,
    };
    if (!payload.nome) { setErroEmpresa("Nome é obrigatório."); setSavingEmpresa(false); return; }

    let error: { message: string } | null = null;
    if (modalEmpresa === "criar") {
      ({ error } = await supabase.from("portal_empresas").insert(payload));
    } else if (empresaEditando) {
      ({ error } = await supabase.from("portal_empresas").update(payload).eq("id", empresaEditando.id));
    }

    if (error) { setErroEmpresa(error.message); setSavingEmpresa(false); return; }
    setModalEmpresa(null);
    setSavingEmpresa(false);
    await carregar();
  }

  async function excluirEmpresa(emp: Empresa) {
    if (!confirm(`Excluir "${emp.nome}"? Isso remove todos os vínculos, mensagens e dados dessa empresa.`)) return;
    await supabase.from("portal_empresas").delete().eq("id", emp.id);
    await carregar();
  }

  // ---------- Vínculos ----------
  async function adicionarVinculo() {
    if (!modalVinculos) return;
    setSavingVinculo(true);
    setErroVinculo(null);

    // Resolve email → user_id via server function (uses service_role, safe)
    const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
    let userId: string;
    try {
      const result = await buscarUsuarioPorEmail({ data: { email: novoVinculoEmail.trim(), token } });
      if (!result.found || !result.user) {
        setErroVinculo("Usuário não encontrado. Verifique o e-mail exato.");
        setSavingVinculo(false);
        return;
      }
      userId = result.user.id;
    } catch {
      setErroVinculo("Erro ao buscar usuário. Tente novamente.");
      setSavingVinculo(false);
      return;
    }

    const { error } = await supabase.from("portal_usuario_empresa").insert({
      user_id: userId,
      empresa_id: modalVinculos.id,
      papel: novoVinculoPapel,
    });

    if (error) { setErroVinculo(error.message); setSavingVinculo(false); return; }

    setNovoVinculoEmail("");
    setSavingVinculo(false);
    await carregar();
  }

  async function removerVinculo(vinculoId: string) {
    if (!confirm("Remover esse usuário da empresa?")) return;
    await supabase.from("portal_usuario_empresa").delete().eq("id", vinculoId);
    await carregar();
    if (modalVinculos) {
      const emp = empresas.find((e) => e.id === modalVinculos.id);
      if (emp) setModalVinculos(emp);
    }
  }

  // after refresh, keep modal in sync
  useEffect(() => {
    if (modalVinculos) {
      const atualizada = empresas.find((e) => e.id === modalVinculos.id);
      if (atualizada) setModalVinculos(atualizada);
    }
  }, [empresas]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{empresas.length} empresa{empresas.length !== 1 ? "s" : ""} cadastrada{empresas.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={abrirCriar} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Nova empresa
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><div className="h-4 w-40 rounded bg-muted animate-pulse" /></CardHeader>
              <CardContent><div className="h-3 w-24 rounded bg-muted animate-pulse" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                <TableHead className="hidden lg:table-cell">Contato</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Criada</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma empresa cadastrada ainda.
                  </TableCell>
                </TableRow>
              )}
              {empresas.map((emp) => {
                const { label, variant } = STATUS_MAP[emp.status as StatusEmpresa] ?? STATUS_MAP.ativa;
                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{emp.nome}</p>
                          {emp.nome_fantasia && (
                            <p className="text-xs text-muted-foreground">{emp.nome_fantasia}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                      {emp.cnpj ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-xs">
                        {emp.email && <p>{emp.email}</p>}
                        {emp.telefone && <p className="text-muted-foreground">{emp.telefone}</p>}
                        {!emp.email && !emp.telefone && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setModalVinculos(emp)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Users className="h-3 w-3" />
                        {emp.vinculos.length}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant} className="h-5 px-1.5 text-[10px]">{label}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatDistanceToNow(new Date(emp.created_at), { locale: ptBR, addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => abrirEditar(emp)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setModalVinculos(emp)}>
                            <Users className="mr-2 h-3.5 w-3.5" /> Gerenciar usuários
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => excluirEmpresa(emp)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ===== Modal Empresa ===== */}
      <Dialog open={modalEmpresa !== null} onOpenChange={(o) => !o && setModalEmpresa(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalEmpresa === "criar" ? "Nova empresa" : "Editar empresa"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nome">Razão social *</Label>
              <Input
                id="nome"
                value={formEmpresa.nome}
                onChange={(e) => setFormEmpresa((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Cervantes Cimentos Ltda"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nome_fantasia">Nome fantasia</Label>
              <Input
                id="nome_fantasia"
                value={formEmpresa.nome_fantasia}
                onChange={(e) => setFormEmpresa((f) => ({ ...f, nome_fantasia: e.target.value }))}
                placeholder="Ex: Cervantes"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formEmpresa.cnpj}
                  onChange={(e) => setFormEmpresa((f) => ({ ...f, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formEmpresa.telefone}
                  onChange={(e) => setFormEmpresa((f) => ({ ...f, telefone: e.target.value }))}
                  placeholder="(31) 99999-9999"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formEmpresa.email}
                onChange={(e) => setFormEmpresa((f) => ({ ...f, email: e.target.value }))}
                placeholder="financeiro@empresa.com.br"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={formEmpresa.status}
                onValueChange={(v) => setFormEmpresa((f) => ({ ...f, status: v as StatusEmpresa }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {erroEmpresa && (
              <p className="text-sm text-destructive">{erroEmpresa}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEmpresa(null)}>Cancelar</Button>
            <Button onClick={salvarEmpresa} disabled={savingEmpresa}>
              {savingEmpresa ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Modal Vínculos ===== */}
      <Dialog open={modalVinculos !== null} onOpenChange={(o) => !o && setModalVinculos(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {modalVinculos?.nome} — Usuários
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Lista de vínculos existentes */}
            {(modalVinculos?.vinculos.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário vinculado.</p>
            ) : (
              <div className="rounded-md border divide-y">
                {modalVinculos?.vinculos.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{v.email ?? v.user_id.slice(0, 8) + "…"}</p>
                      <p className="text-xs text-muted-foreground">{PAPEIS[v.papel] ?? v.papel}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removerVinculo(v.id)}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar novo vínculo */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <UserPlus className="h-3 w-3" /> Adicionar usuário
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="email_vinculo" className="text-xs">E-mail do usuário</Label>
                <Input
                  id="email_vinculo"
                  type="email"
                  value={novoVinculoEmail}
                  onChange={(e) => setNovoVinculoEmail(e.target.value)}
                  placeholder="usuario@empresa.com.br"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Papel</Label>
                <Select
                  value={novoVinculoPapel}
                  onValueChange={(v) => setNovoVinculoPapel(v as Papel)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PAPEIS) as [Papel, string][]).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {erroVinculo && <p className="text-xs text-destructive">{erroVinculo}</p>}
              <Button
                size="sm"
                className="w-full"
                onClick={adicionarVinculo}
                disabled={savingVinculo || !novoVinculoEmail.trim()}
              >
                {savingVinculo ? "Adicionando…" : "Adicionar"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalVinculos(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
