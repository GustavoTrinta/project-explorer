
# Etapa 1 — Fundação do Portal 30%

Objetivo: deixar o esqueleto do sistema rodando com Supabase próprio (sem Lovable Cloud), autenticação funcional, schema completo, RLS, layout base do Portal do Cliente e do Painel Interno, seletor de empresa e roteamento por papel. Telas internas ficam como placeholders, prontas para as próximas etapas.

## 1. Conexão Supabase (manual)

- O usuário cria/usa um projeto próprio no dashboard do Supabase.
- Adicionar duas variáveis no projeto (via formulário de secrets do Lovable, lidas em `import.meta.env`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Criar `src/integrations/supabase/client.ts` instanciando `createClient` de `@supabase/supabase-js` com persistência de sessão em `localStorage`.
- Edge Functions do pacote (Etapas 6+) usarão `SUPABASE_SERVICE_ROLE_KEY` direto no painel do Supabase — não entra no front.

Sem integração nativa do Lovable: schema, RLS e secrets ficam gerenciados pelo usuário no dashboard do Supabase. Eu entrego os SQLs prontos para colar no SQL Editor.

## 2. Schema do banco (SQL para colar no Supabase)

Tabelas conforme `project-knowledge.md`:

- `profiles` (id, nome, email, avatar_url, created_at) — espelha `auth.users`
- `empresas` (id, nome, cnpj, codigo, cor_avatar, whatsapp_numero, email_contato, sharepoint_site_id, status, created_at)
- `usuario_empresa` (user_id, empresa_id, papel) — papel: `admin_interno | colaborador_interno | cliente`
- `mensagens` (id, empresa_id, canal, direcao, remetente_nome, remetente_contato, conteudo, metadata, respondida, created_at)
- `documentos` (id, empresa_id, sharepoint_file_id, nome, categoria, competencia, url, tamanho, created_at)
- `tarefas` (id, empresa_id, titulo, descricao, status, categoria, responsavel_id, prazo, urgente, created_at)
- `obrigacoes` (id, empresa_id, nome, tipo, data_vencimento, status, valor, created_at)

Trigger `handle_new_user` em `auth.users` cria `profiles` automaticamente.

## 3. RLS (todas as tabelas)

Padrão: tudo bloqueado por padrão; acesso via função `SECURITY DEFINER` para evitar recursão.

- `has_papel(_user_id uuid, _papel text)` — checa `usuario_empresa`
- `is_membro_empresa(_user_id, _empresa_id)` — checa vínculo
- `is_interno(_user_id)` — true se papel ∈ (admin_interno, colaborador_interno) em qualquer empresa

Políticas resumidas:
- `profiles`: usuário lê/atualiza o próprio.
- `empresas`, `mensagens`, `documentos`, `tarefas`, `obrigacoes`: SELECT/INSERT/UPDATE permitidos se `is_interno(auth.uid())` OU `is_membro_empresa(auth.uid(), empresa_id)`.
- `usuario_empresa`: SELECT do próprio vínculo; gestão só por `admin_interno`.

## 4. Autenticação

- Tela `/login` (email + senha) usando `supabase.auth.signInWithPassword`.
- Tela `/esqueci-senha` com `resetPasswordForEmail` apontando para `/redefinir-senha`.
- Tela `/redefinir-senha` para `auth.updateUser({ password })`.
- Hook `useAuth` (Context) com `onAuthStateChange` configurado ANTES do `getSession`.
- Sem cadastro público — usuários são criados pelo admin (Etapa 10). Por enquanto, o `supabase-seed.sql` cria os primeiros logins.

## 5. Multi-empresa e contexto ativo

- Após login, consulta `usuario_empresa` do usuário.
- 0 empresas → tela de erro "sem acesso".
- 1 empresa → redireciona direto (cliente → `/portal/inicio`, interno → `/interno/dashboard`).
- 2+ → tela `/selecionar-empresa` com cards (logo/avatar, nome, cnpj).
- `EmpresaContext` guarda `empresaAtiva` e `papelNaEmpresaAtiva`; persistido em `localStorage`.
- Switcher de empresa na sidebar.

## 6. Roteamento e proteção (TanStack Router)

Estrutura em `src/routes/`:

```
__root.tsx
index.tsx                          → redireciona para /login ou painel correto
login.tsx
esqueci-senha.tsx
redefinir-senha.tsx
selecionar-empresa.tsx
_authenticated.tsx                 → guarda de sessão (beforeLoad + redirect)
_authenticated/portal.tsx          → layout cliente, exige papel='cliente' OU interno
_authenticated/portal/inicio.tsx   → placeholder
_authenticated/portal/mensagens.tsx
_authenticated/portal/documentos.tsx
_authenticated/portal/obrigacoes.tsx
_authenticated/interno.tsx         → layout interno, exige papel interno
_authenticated/interno/dashboard.tsx
_authenticated/interno/mensagens.tsx
_authenticated/interno/tarefas.tsx
_authenticated/interno/clientes.tsx
```

Proteção por papel feita no `beforeLoad` dos layouts `portal.tsx` e `interno.tsx` consultando o contexto de auth/empresa.

## 7. Layout base e identidade visual

- Tokens em `src/styles.css` com `oklch`:
  - `--primary` (#1a1a2e), `--accent` (#f5a623), `--background` (#f0f2f5)
  - Tokens semânticos: `--whatsapp` (#25d366), `--email` (#1a73e8), `--portal` (#f5a623) para os pills de canal
- Fonte Inter via `<link>` no `__root.tsx`
- Componentes shadcn já instalados; criar:
  - `AppSidebar` (logo, switcher de empresa, navegação por papel, perfil + logout)
  - `AppTopbar` (título da página, avatar)
  - `EmpresaSwitcher`, `ChannelPill`, `PapelBadge`
- Layouts `portal.tsx` e `interno.tsx` com sidebar fixa + `<Outlet />`

## 8. Seed inicial

`supabase-seed.sql` (do pacote) cria 2 empresas exemplo, 1 admin interno, 1 colaborador, 2 clientes (um deles vinculado às duas empresas para testar o seletor). Documentar no README como rodar.

## 9. Entregáveis verificáveis

- Login funciona com usuário do seed
- Cliente vinculado a 2 empresas vê o seletor; ao escolher, cai em `/portal/inicio` da empresa certa
- Cliente NÃO consegue acessar `/interno/*` (redireciona)
- Interno acessa `/interno/dashboard` e vê dados de qualquer empresa
- RLS confirmada: query no SQL Editor como usuário cliente só retorna a empresa dele

## Detalhes técnicos

- **Server-side**: nesta etapa NÃO usamos `createServerFn` nem rotas `/api/*`. Tudo direto via `@supabase/supabase-js` no client. Edge Functions do Supabase entram nas Etapas 6+.
- **Realtime**: configurar `supabase.channel(...)` será feito nas Etapas 2/3. Aqui só habilitar publicação realtime nas tabelas `mensagens`, `tarefas`, `obrigacoes` no SQL.
- **Tipos**: gerar `src/integrations/supabase/types.ts` rodando `supabase gen types` (instruções no README) — ou tipar manualmente o essencial nesta etapa.
- **Sem Lovable Cloud**: nenhum tool de Cloud é chamado; o usuário gerencia projeto, secrets, RLS e Edge Functions diretamente no dashboard do Supabase.

## Fora do escopo (próximas etapas)
- Conteúdo real das telas internas (Etapas 2–4)
- Drag-and-drop do Kanban (Etapa 8)
- Edge Functions de WhatsApp/Email/SharePoint (Etapas 6, 7, 9)
- Tela de configurações/admin (Etapa 10)
