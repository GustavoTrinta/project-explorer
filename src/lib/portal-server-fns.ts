import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://gpkmghexknouwioeufgh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwa21naGV4a25vdXdpb2V1ZmdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUyMzY3NSwiZXhwIjoyMDk0MDk5Njc1fQ.T_eN0HUjSxRz44lRqDG0lbZvtmAqsX0VVMOg1PJDv_w",
  { auth: { persistSession: false } }
);

async function assertInterno(callerToken: string): Promise<boolean> {
  const { data: { user } } = await supabaseAdmin.auth.getUser(callerToken);
  if (!user) return false;
  const { data } = await supabaseAdmin
    .from("portal_usuario_empresa")
    .select("id")
    .eq("user_id", user.id)
    .in("papel", ["admin_interno", "colaborador_interno"])
    .limit(1)
    .maybeSingle();
  return !!data;
}

export const buscarUsuarioPorEmail = createServerFn({ method: "GET" })
  .inputValidator((input: { email: string; token: string }) => input)
  .handler(async ({ data: { email, token } }) => {
    if (!(await assertInterno(token))) throw new Error("forbidden");

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .ilike("email", email.trim())
      .maybeSingle();

    if (!data) return { found: false as const };
    return { found: true as const, user: { id: data.id, email: data.email, full_name: data.full_name } };
  });

export const buscarUsuariosPorIds = createServerFn({ method: "GET" })
  .inputValidator((input: { ids: string[]; token: string }) => input)
  .handler(async ({ data: { ids, token } }) => {
    if (ids.length === 0) return { users: [] as { id: string; email: string; full_name: string | null }[] };
    if (!(await assertInterno(token))) return { users: [] as { id: string; email: string; full_name: string | null }[] };

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids);

    return { users: (data ?? []) as { id: string; email: string; full_name: string | null }[] };
  });
