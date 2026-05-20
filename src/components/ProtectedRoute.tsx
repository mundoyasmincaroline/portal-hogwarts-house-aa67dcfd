import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login but save the current location
        navigate("/login", { state: { from: location.pathname } });
      } else if (adminOnly && !isAdmin) {
        // Redirect to dashboard if not admin
        navigate("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, adminOnly, navigate, location]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-float mb-4">⚡</div>
          <p className="font-heading text-muted-foreground">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (adminOnly && !isAdmin) return null;

  return <>{children}</>;
}
