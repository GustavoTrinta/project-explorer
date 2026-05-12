import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/esqueci-senha")({ component: Page });

function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-lg">
        <h1 className="text-xl font-semibold">Recuperar senha</h1>
        {sent ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Se o e-mail estiver cadastrado, você receberá um link em instantes.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando…" : "Enviar link"}
            </Button>
          </form>
        )}
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
