import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  MessageSquare,
  FileText,
  CalendarClock,
  LayoutDashboard,
  KanbanSquare,
  Inbox,
  Users,
  ChevronsUpDown,
  LogOut,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa } from "@/hooks/use-empresa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const portalItems = [
  { title: "Início", url: "/portal/inicio", icon: Home },
  { title: "Mensagens", url: "/portal/mensagens", icon: MessageSquare },
  { title: "Documentos", url: "/portal/documentos", icon: FileText },
  { title: "Obrigações", url: "/portal/obrigacoes", icon: CalendarClock },
] as const;

const internoItems = [
  { title: "Dashboard", url: "/interno/dashboard", icon: LayoutDashboard },
  { title: "Mensagens", url: "/interno/mensagens", icon: Inbox },
  { title: "Tarefas", url: "/interno/tarefas", icon: KanbanSquare },
  { title: "Clientes", url: "/interno/clientes", icon: Users },
] as const;

export function AppSidebar({ area }: { area: "portal" | "interno" }) {
  const items = area === "portal" ? portalItems : internoItems;
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user, vinculos, signOut, isInterno } = useAuth();
  const { empresaAtiva, setEmpresaAtiva, clear } = useEmpresa();
  const navigate = useNavigate();

  const empresa = empresaAtiva?.empresa;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground text-xs font-bold">
            30%
          </div>
          <span className="font-semibold group-data-[collapsible=icon]:hidden">Portal 30%</span>
        </div>
        {vinculos.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mx-2 mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-primary-foreground"
                  style={{ backgroundColor: "#1a1a2e" }}
                >
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{empresa?.nome ?? "Selecionar"}</p>
                  <p className="truncate text-[10px] text-sidebar-foreground/60">
                    {vinculos.length} {vinculos.length === 1 ? "empresa" : "empresas"}
                  </p>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Trocar empresa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {vinculos.map((v) => (
                <DropdownMenuItem
                  key={v.empresa_id}
                  onClick={() => {
                    setEmpresaAtiva(v);
                    navigate({ to: isInterno ? "/interno/dashboard" : "/portal/inicio" });
                  }}
                >
                  <span
                    className="mr-2 inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: "#1a1a2e" }}
                  />
                  {v.empresa.nome}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{area === "portal" ? "Cliente" : "Equipe"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs">
            {(user?.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs">{user?.email}</p>
          </div>
          <button
            onClick={async () => {
              await signOut();
              clear();
              navigate({ to: "/login" });
            }}
            title="Sair"
            className="rounded-md p-1.5 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
