import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({ component: AuthGate });

function AuthGate() {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <Outlet />;
}
